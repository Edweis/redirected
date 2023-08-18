// constants
const IS_DEV = !window.location.host;
const API_BASE = IS_DEV ? "http://localhost:3000" : "";
const qEach = (query, ctxOrFn, fn) => { (fn ? ctxOrFn : document).querySelectorAll(query).forEach(fn || ctxOrFn) };
const q = (query, ctx) => (ctx || document).querySelector(query);

const RANDOM_PLACEHOLDERS = [
    { pathname: 'meeting', destination: 'calendly.com/awesome/1-hour' },
    { pathname: 'github', destination: 'github.com/edweis' },
    { pathname: 'linkedin', destination: 'linkedin.com/in/frulliere/' },
    { pathname: 'telegram', destination: 't.me/francoisrulliere' },
    { pathname: 'whatsapp', destination: 'wa.me/6589595402' },
    { pathname: 'contracts/marcus', destination: 'docs.google.com/document/d/NeoxZKeDCK27XWjc/edit' },
    { pathname: 'facebook', destination: 'facebook.com/redirected-app' },
    { pathname: 'instagram', destination: 'instagram.com/redirected-app' },
    { pathname: 'twitter', destination: 'https://twitter.com/redirected-app' },
    { pathname: 'elastic', destination: 'redirected-app.kb.ap-southeast-1.aws.found.io:9243' },
]

/** Hash a string. Implementation of Fowler-Noll-Vo (FNV) algorithm.
 * Not to be used for cryptographic purpose. */
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
// listen to input change
const form = {};
qEach("form input", (input) => {
    form[input.name] = input.value;
    input.addEventListener("change", (e) => {
        form[e.target.name] = e.target.value;
    });
});


// STEP 1
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
    pathInput.parentNode.innerHTML = `https://${form.domain}/${pathname}`
    const destInput = q("input[name=destination]", nextLine)
    destInput.parentNode.innerHTML = destination;
    q("[data-copy]", nextLine).setAttribute('data-copy', `https://${form.domain}/${pathname}`)
    q("[data-remove]", nextLine).addEventListener('click', () => rmRedirect(pathname))
    q("#" + nextLine.id)?.remove(); // remove existing before adding
    console.log({ nextLine, pathname, destination, pathInput })
    template.parentNode.insertBefore(nextLine, template);
}

function fetchRedirects(domain) {
    fetch(API_BASE + "/redirects/" + domain)
        .then((r) => r.json())
        .then((redirects) => {
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

function checkDomain() {
    const SUB_DOMAIN_REGEX =
        /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,7}$/;
    const isValid = SUB_DOMAIN_REGEX.test(form.domain);
    const domainInput = q("input[name=domain]");
    if (isValid) {
        // event.target.disabled = true;
        q("input[name=pathname]").disabled = false;
        q("input[name=destination]").disabled = false;
        q("input[name=pathname]").focus();
        fetchRedirects(form.domain);
        qEach("[data-domain]", i => i.innerHTML = form.domain)
        q("#instr").style.display = "block";
    } else {
        domainInput.setCustomValidity("Your subdomain is not right...");
        domainInput.reportValidity();
        q("#instr").style.display = "none";
    }
}
checkDomain()
q("input[name=domain]").addEventListener("blur", checkDomain);

// STEP 2 - Create a redirect
q("#add-redirect").addEventListener("click", async (event) => {
    event.preventDefault();
    const body = JSON.stringify(form);
    await fetch(API_BASE + "/redirects", { method: "POST", body });
    insertRedirect(form.pathname, `https://${form.destination}`);
    q("input[name=pathname]").value = "";
    q("input[name=destination]").value = "";
    q("input[name=pathname]").focus();
});



// STEP 3 - Check DNS
q("#check-dns").addEventListener("click", async (e) => {
    e.preventDefault();
    e.target.innerHTML = "Checking ...";
    e.target.disabled = true;
    const body = JSON.stringify({ domain: form.domain });
    const response = await fetch(API_BASE + "/dns", { method: "POST", body });
    const { isValid } = await response.json();
    if (isValid) {
        e.target.innerHTML = "DNS is properly set!"
    } else {
        e.target.disabled = false
        e.target.innerHTML = "DNS not set. Check again ?"
    }
});

// Copy to clipboard
document.addEventListener('click', (e) => {
    const value = e.target.getAttribute('data-copy');
    if (value) navigator.clipboard.writeText(value);
}, false);
