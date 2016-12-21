exports.Type = Type;

function Type(args) {
    Object.assign(this, args);
}

Type.prototype = {
    resolve: function(obj, field, store) {
        // If we have a defined resolver for this field use it.
        if (this.resolvers && field in this.resolvers)
            return this.resolvers[field](obj, store);

        // Otherwise return the scalar field from the object.
        return {
            type: null,
            resolved: obj[field]
        };
    },

    // When a cacheKey changes for an object, it invalidate the object's cache
    // and the caches of it's parents all the way up the query result tree.
    // By default we use random strings so that no caching takes place.
    cacheKey: function(obj, store) {
        return '(' + Math.random().toString() + ')';
    }
}
