exports.Query = require('./queries').Query;
exports.Type = require('./types').Type;

const cache = {};

// Hydrate the given type from the store using the fragment specification.
exports.hydrate = function hydrate(type, fragment, store) {
    if (!type) console.warn("hydrate() called with a null query type.");
    if (!fragment) console.warn("hydrate() called with a null fragment.");
    if (!store) console.warn("hydrate() called with a null store.");

    return _hydrate({}, type, fragment, store, '').hydrated;
}

function _hydrate(object, objectType, fragment, store, cacheString) {
    var hydrated = {};
    var canCache = true;

    // If type has name, add to cacheString (used for caching queries of same type
    // but different parameters).
    cacheString += objectType.name || '';

    // Compute the values in this object the fragment asks for.
    // Note that even with caching we still have to run this computation,
    // as we could have nested children who have changed and we have no
    // idea at this stage whether this is the case.
    var result;
    var childCacheString;
    var hydratedChild;
    var keys = Object.keys(fragment), key;
    for (var keyN in keys) {
        key = keys[keyN];

        try {
            result = objectType.resolve(object, key, store)
        } catch(e) {
            console.warn("Hydration resolver failed", e);
            result = { resolved: null, type: null };
        }

        if (!result) {
            console.warn("Resolver for " + key + " returned null, applied to object:");
            console.dir(object);
        }

        if (!('type' in result) || !('resolved' in result)) {
            console.warn("Resolver for " + key + " returned:");
            console.dir(result);
            console.warn("Resolvers always need to return object of structure { type, resolved }.");
        }

        // If we can and need to go even deeper in the schema, do so.
        // There is the possibility of type being null, which means one of two things:
        //   1) the resolved value is a scalar, in which case we can't go deeper.
        //   2) the resolved value was returned as null, in which case we can't.
        if (result.type != null && fragment[key] && typeof fragment[key] === 'object') {
            childCacheString = cacheString + '-' + key;

            if (result.resolved.constructor === Array) {
                hydratedChild = result.resolved.map(function(value) { return _hydrate(value, result.type, fragment[key], store, childCacheString); });

                hydrated[key] = hydratedChild
                    .map(function(value) { return value.hydrated; });
                canCache = hydratedChild
                    .map(function(value) { return value.canCache; })
                    .reduce(function(x, y) { return x && y }, canCache);
            } else {
                var hydratedChild = _hydrate(result.resolved, result.type, fragment[key], store, childCacheString);

                hydrated[key] = hydratedChild.hydrated;
                canCache = canCache && hydratedChild.canCache;
            }
        } else {
            hydrated[key] = result.resolved;
        }
    }


    // Add this object's cacheKey to the cacheString.
    // We do this here to allow modular caching at each level of the fragment.
    cacheString += '(' + objectType.cacheKey(object, store) + ')';

    // If we can cache, send back the cached object.
    if (canCache && cacheString in cache)
        return { hydrated: cache[cacheString], canCache }

    cache[cacheString] = hydrated;
    return { hydrated, canCache: false };
}
