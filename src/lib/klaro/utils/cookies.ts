export function getCookies(): { name: string; value: string }[] {
    const cookieStrings = document.cookie.split(';');
    const cookies: { name: string; value: string }[] = [];
    const regex = new RegExp('^\\s*([^=]+)\\s*=\\s*(.*?)$');

    for (let i = 0; i < cookieStrings.length; i++) {
        const cookieStr = cookieStrings[i];
        const match = regex.exec(cookieStr);
        if (match === null) continue;
        cookies.push({
            name: match[1],
            value: match[2]
        });
    }

    return cookies;
}

export function getCookie(name: string): { name: string; value: string } | null {
    const cookies = getCookies();

    for (let i = 0; i < cookies.length; i++) {
        if (cookies[i].name === name) return cookies[i];
    }

    return null;
}

//https://stackoverflow.com/questions/14573223/set-cookie-and-get-cookie-with-javascript
export function setCookie(
    name: string,
    value: string,
    days: number | undefined = undefined,
    domain: string | undefined = undefined,
    path: string = '/'
): void {
    let expires = '';

    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
        expires = '; expires=' + date.toUTCString();
    }

    if (domain !== undefined) {
        expires += '; domain=' + domain;
    }

    expires += '; path=' + path;

    document.cookie = name + '=' + (value || '') + expires + '; SameSite=Lax';
}

export function deleteCookie(name: string, path: string = '/', domain: string | undefined = undefined) {
    let str = name + '=; Max-Age=-99999999;';
    // try to delete the cookie without any path and domain
    document.cookie = str;

    str += ' path=' + path + ';';
    // try to delete the cookie with path
    document.cookie = str;

    if (domain) {
        str += ' domain=' + domain + ';';
        // try to delete the cookie with domain and path
        document.cookie = str;
    }
}
