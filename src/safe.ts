export default (fn: any) => (r: any) => {
    try {
        if (fn) {
            const result = fn(r);

            if (result instanceof Promise) {
                return result.catch(() => r);
            }
            
return result;
        }
        
return r;
    } catch {
        return r;
    }
};
