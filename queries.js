var Type = require('./types').Type;

exports.Query = function(args) {
    // We need a name to create a unique identifier for this query for caching purposes.
    // If one isn't provided, we'll just use a random string.
    var baseName = args.name || ('QUERY[' + Math.random().toString() + ']');

    return function(parameters) {
        var name = baseName;
        Object
            .keys(parameters || {})
            .map((key) => { name += '(' + key + ':' + parameters[key] + ')' });

        // Create paramterised resolver functions.
        var resolvers = {};
        Object
            .keys(args.resolvers || {})
            .map((key) => {
                resolvers[key] = function(obj, store) {
                    return args.resolvers[key](obj, store, parameters);
                }
             });

        return new Type(
            Object.assign({}, args, {
                resolvers,
                name
            })
        );
    }
};
