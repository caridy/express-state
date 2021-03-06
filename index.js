'use strict';

var express = require('express'),
    Exposed = require('./lib/exposed'),

    appProto = express.application,
    resProto = express.response;

exports.local     = 'state';
exports.namespace = null;

// Protect against multiple copies of this module augmenting the Express
// `application` and `response` prototypes.
if (typeof appProto.expose === 'function' &&
    typeof resProto.expose === 'function') {

    return;
}

// Modifies Express' `application` and `response` prototypes by adding the
// `expose()` method.
resProto.expose = appProto.expose = function (obj, namespace, local) {
    var app           = this.app || this,
        appLocals     = this.app && this.app.locals,
        locals        = this.locals,
        rootNamespace = app.get('state namespace') || exports.namespace,
        exposed, type;

    if (!local) {
        local = app.get('state local') || exports.local;
    }

    exposed = locals[local];

    if(!Exposed.isExposed(exposed)) {
        // Creates a new `Exposed` instance, and links its prototype to the
        // corresponding app exposed object, if one exists.
        exposed = locals[local] = Exposed.create(appLocals && appLocals[local]);
    }

    // When no namespace is provided, expose each value of the specified `obj`
    // at each of its keys, then return early.
    if (!(namespace || rootNamespace)) {
        type = typeof obj;

        // Only get the keys of enumerable objects.
        if ((type === 'object' || type === 'function') && obj !== null) {
            Object.keys(obj).forEach(function (key) {
                exposed.add(key, obj[key]);
            });
        }

        return;
    }

    if (namespace) {
        if (/^window\..+/.test(namespace)) {
            namespace = namespace.replace('window.', '');
        } else if (rootNamespace && namespace.indexOf(rootNamespace) !== 0) {
            namespace = rootNamespace + '.' + namespace;
        }
    } else {
        namespace = rootNamespace;
    }

    exposed.add(namespace, obj);
};
