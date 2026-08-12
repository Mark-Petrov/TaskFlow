export function routeParam(req, key) {
    const value = req.params[key];
    if (!value)
        throw new Error(`Missing route param: ${key}`);
    return value;
}
