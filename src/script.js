// constants
const IS_DEV = !window.location.host;
const API_BASE = IS_DEV ? "http://localhost:3000" : "";
const qEach = (query, fn) => document.querySelectorAll(query).forEach(fn);
const q = (query) => document.querySelector(query);
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

// variables
let listRedirects = [];

// STEP 1
function insertRedirect(pathname, destination) {
    const template = q("#form-row");
    const nextLine = template.cloneNode(true);

    nextLine.id = "line-" + simpleHash(pathname, destination);
    nextLine.querySelector("input[name=pathname]").parentNode.innerHTML =
        pathname;
    nextLine.querySelector("input[name=destination]").parentNode.innerHTML =
        destination;
    nextLine.querySelector("a").href =
        "https://" + form.domain + "/" + pathname;
    q("#" + nextLine.id)?.remove(); // remove existing before adding
    template.parentNode.insertBefore(nextLine, template);
}

function fetchRedirects(domain) {
    fetch(API_BASE + "/redirects/" + form.domain)
        .then((r) => r.json())
        .then((redirects) => {
            const template = q("#form-row");
            // remove existing rows
            template.parentNode.childNodes.forEach(
                (node, index) =>
                    index > 0 && node.id !== "form-row" && node.remove()
            );
            const nodes = (redirects || []).forEach((redirect) => {
                insertRedirect(redirect.pathname, redirect.destination);
            });
        });
}

q("input[name=domain]").addEventListener("blur", () => {
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
        q("#instr-domain").innerHTML = form.domain;
        q("#instr").style.display = "block";
    } else {
        domainInput.setCustomValidity("Your subdomain is not right...");
        domainInput.reportValidity();
        q("#instr").style.display = "none";
    }
});

// STEP 2 - Create a redirect
q("#add-redirect").addEventListener("click", async (event) => {
    event.preventDefault();
    const body = JSON.stringify(form);
    await fetch(API_BASE + "/redirects", {method: "POST", body});
    insertRedirect(form.pathname, form.destination);
    q("input[name=pathname]").value = "";
    q("input[name=destination]").value = "";
    q("input[name=pathname]").focus();
});

// STEP 3 - Check DNS
q("#check-dns").addEventListener("click", async (event) => {
    event.preventDefault();
    const body = JSON.stringify({domain: form.domain});
    q("#dns-status").innerHTML = "Loading ...";
    const response = await fetch(API_BASE + "/dns", {method: "POST", body});
    const {isValid} = await response.json();
    q("#dns-status").innerHTML = isValid
        ? "DNS is properly set"
        : "DNS was not found";
});