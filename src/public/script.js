/* Constants and helpers */
const IS_DEV = !window.location.host;
const API_BASE = IS_DEV ? "http://localhost:3000" : "";
const qEach = (query, ctxOrFn, fn) => { (fn ? ctxOrFn : document).querySelectorAll(query).forEach(fn || ctxOrFn) };
const q = (query, ctx) => (ctx || document).querySelector(query);

const RANDOM_PLACEHOLDERS = [
    { pathname: 'meeting', destination: 'zcal.co/awesome/1-hour' },
    { pathname: 'github', destination: 'github.com/edweis' },
    { pathname: 'linkedin', destination: 'linkedin.com/in/frulliere/' },
    { pathname: 'telegram', destination: 't.me/francoisrulliere' },
    { pathname: 'whatsapp', destination: 'wa.me/6589595402' },
    { pathname: 'contracts/marcus', destination: 'docs.google.com/document/d/NeoxZKeDCK27XWjc/edit' },
    { pathname: 'facebook', destination: 'facebook.com/redirected-app' },
    { pathname: 'instagram', destination: 'instagram.com/redirected-app' },
    { pathname: 'twitter', destination: 'twitter.com/redirected-app' },
    { pathname: 'elastic', destination: 'redirected-app.kb.ap-southeast-1.aws.found.io:9243' },
    { pathname: 'company', destination: 'garnet.center' },
    { pathname: 'hn', destination: 'news.ycombinator.com/user?id=redirected' },
].sort(() => Math.random() - 0.5)
function* _genPlaceholders() {
    for (const item of RANDOM_PLACEHOLDERS) yield item;
    return _genPlaceholders()
}
const genPlaceholders = _genPlaceholders()

/** Hash a string. Implementation of Fowler-Noll-Vo (FNV) algorithm. */
const simpleHash = (str) => {
    const FNV_OFFSET_BASIS = 0x811c9dc5;
    const FNV_PRIME = 0x01000193;
    let hash = FNV_OFFSET_BASIS;
    for (let i = 0; i < str.length; i += 1) {
        hash *= FNV_PRIME;
        hash ^= str.charCodeAt(i);
    }
    const hash32 = hash >>> 0;
    return hash32.toString(36);
};
// @see https://github.com/jquense/yup/blob/master/src/string.ts#L25C1-L25C1196
const MATCH_URL = /^(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i;

/* Interactions */
const form = {};
q('[name=destination]').addEventListener('input', e => e.target.value = e.target.value.replace(/^http?s:\/\//, ''))
if (localStorage.getItem('domain'))  // set cached value
    q('input[name=domain]').value = localStorage.getItem('domain')
qEach("form input", (input) => {
    form[input.name] = input.value;
    input.addEventListener("input", (e) => form[e.target.name] = e.target.value );
});


// STEP 1
function refreshPlaceholders() {
    const placeholders = genPlaceholders.next().value
    q('#line-template input[name=pathname]').placeholder = placeholders.pathname
    q('#line-template input[name=destination]').placeholder = placeholders.destination
}
refreshPlaceholders() // set placeholders on load
function rmRedirect(pathname) {
    const path = form.domain + '/' + pathname
    fetch(API_BASE + "/redirects/" + path, { method: 'DELETE' });
    q("#line-" + simpleHash(pathname))?.remove();
}
function insertRedirect(pathname, destination) {
    const template = q("#line-template");
    const nextLine = template.cloneNode(true);

    nextLine.id = "line-" + simpleHash(pathname);
    const pathInput = q("input[name=pathname]", nextLine);
    if (window.matchMedia("(min-width: 640px)").matches)
        pathInput.parentNode.innerHTML = `https://${form.domain}/${pathname}`
    else pathInput.parentNode.innerHTML = `/${pathname}`
    const destInput = q("input[name=destination]", nextLine)
    destInput.parentNode.innerHTML = destination;
    q("[data-copy]", nextLine).setAttribute('data-copy', `https://${form.domain}/${pathname}`)
    q("[data-remove]", nextLine).addEventListener('click', () => rmRedirect(pathname))
    q("#" + nextLine.id)?.remove(); // remove existing before adding
    template.parentNode.insertBefore(nextLine, template);
    refreshPlaceholders()
}

function fetchRedirects(domain) {
    fetch(API_BASE + "/redirects/" + domain)
        .then((r) => r.json())
        .then(({ redirects, isValid }) => {
            setDnsValid(isValid)
            const template = q("#line-template");
            // remove existing rows
            qEach(
                '.redirection:not(#line-template)',
                template.parentNode,
                (node) => node.remove()
            );
            (redirects || []).forEach((redirect) => {
                insertRedirect(redirect.pathname, redirect.destination);
            });
        });
}
function inputError(query, error) {
    q(query).setCustomValidity(error);
    q(query).reportValidity();
}
function checkDomain() {
    const SUB_DOMAIN_REGEX =
        /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,7}$/;
    const isValid = SUB_DOMAIN_REGEX.test(form.domain);
    if (isValid) {
        q("input[name=pathname]").disabled = false;
        q("input[name=destination]").disabled = false;
        q("input[name=pathname]").focus();
        fetchRedirects(form.domain);
        qEach("[data-domain]", i => i.innerHTML = form.domain)
        q("#instr").style.display = "block";
        localStorage.setItem('domain', form.domain)
    } else {
        if (form.domain)
            inputError("input[name=domain]", "Your subdomain is not right...");
        q("#instr").style.display = "none";
    }
}

checkDomain()
q("input[name=domain]").addEventListener("blur", checkDomain);
q("input[name=domain]").addEventListener("keypress", e => {
    if (e.keyCode === 13) q("input[name=pathname]").focus() // focus on next input
})
q("input[name=pathname]").addEventListener("keypress", e => {
    if (e.keyCode === 13) q("input[name=destination]").focus()
})
q("input[name=destination]").addEventListener("keypress", e => {
    if (e.keyCode === 13) addRedirect()
})


// STEP 2 - Create a redirect
async function addRedirect() {
    if (!form.pathname || form.pathname[0] === '/')
        return inputError("input[name=pathname]", "Invalid pathname");
    if (!form.destination || !MATCH_URL.test(form.destination))
        return inputError("input[name=destination]", "Invalid URL: " + form.destination);

    const body = JSON.stringify(form);
    await fetch(API_BASE + "/redirects", { method: "POST", body });
    insertRedirect(form.pathname, `https://${form.destination}`);
    q("input[name=pathname]").value = "";
    q("input[name=destination]").value = "";
    q("input[name=pathname]").focus();
}
q("#add-redirect").addEventListener("click", async (event) => {
    event.preventDefault();
    addRedirect()
});



// STEP 3 - Check DNS
function setDnsValid(isValid) {
    if (isValid) {
        q("#check-dns").innerHTML = "DNS is set! Redirects are now active."
        q("#check-dns").disabled = true
        q("#check-dns").setAttribute('aria-selected', true);
        q('#redirection-content').setAttribute('aria-selected', true)
    } else {
        q("#check-dns").disabled = false
        q("#check-dns").innerHTML = "DNS not set. Check again ?"
        q("#check-dns").removeAttribute('aria-selected');
        q('#redirection-content').removeAttribute('aria-selected')
    }
}
q("#check-dns").addEventListener("click", async (e) => {
    e.preventDefault();
    e.target.innerHTML = "Checking ...";
    e.target.disabled = true;
    const body = JSON.stringify({ domain: form.domain });
    const response = await fetch(API_BASE + "/dns", { method: "POST", body });
    const { isValid } = await response.json();
    setDnsValid(isValid);
});

// Copy to clipboard
document.addEventListener('click', (e) => {
    const value = e.target.getAttribute('data-copy') || e.target.parentNode.getAttribute('data-copy');
    if (value) {
        console.log('Copied to clipboard', value)
        navigator.clipboard.writeText(value);
    }
}, false);
