# compose-record
> Type-safe utility library for creating nested Immutable Records

[![npm version](https://badge.fury.io/js/compose-record.svg)](https://www.npmjs.com/package/compose-record)
[![Build Status](https://secure.travis-ci.org/ziflex/compose-record.svg?branch=master)](http://travis-ci.org/ziflex/compose-record)
[![Coverage Status](https://coveralls.io/repos/github/ziflex/compose-record/badge.svg?branch=master)](https://coveralls.io/github/ziflex/compose-record)

## Motivation

[Immutable.js](https://facebook.github.io/immutable-js/) is a great library. But, unfortunatelly, in v3 it does not well support nested Records, making its usability less pleasant.
The main purpose of this libary is to make our (my) life easier and reduce amount of boilerplate code by providing robust and typesafe wrapper around [Immutable.Record](https://facebook.github.io/immutable-js/docs/#/Record) class which initializes all other nested Immutable classes. It works like ``fromJS`` but for ``Record``.

## Quick start

The following example shows a very basic use of ``compose-class`` using nested Records.

````javascript
import { compose } from 'compose-record';

const Address = compose({
    name: "Address",
    properties: {
        street: { type: String },
        apt: { type: Number }
    }
});

const Profile = compose({
    name: "Profile",
    properties: {
        name: { type: String },
        address: { type: Address }
    }
});

const p = new Profile();

console.log(p.toJS()); 
/*
 * {
 *     name: ''
 *     address: {
 *         street: '',
 *         apt: 0
 *     }
 * }
 * /

````

## Default values

All properties support custom default value. By default, these values are defined by their types.   

````javascript
import { compose } from 'compose-record';

const Address = compose({
    name: "Address",
    properties: {
        street: { type: String },
        apt: { type: Number }
    }
});

const Profile = compose({
    name: "Profile",
    properties: {
        name: {
            type: String,
            defaultValue: 'unknown'
        },
        address: {
            type: Address,
            defaultValue: {
                street: 'unknown',
                apt: -1
            }
        }
    }
});

const p = new Profile();

console.log(p.toJS());

/*
 * {
 *     name: 'unknown',
 *     address: {
 *         street: 'unknown',
 *         apt: -1
 *     }
 * }
 */
````

## Extension

``compose-record`` allows you to extend your Records with other(s).

````javascript
import { compose } from 'compose-record';

const Entity = compose({
    name: "Entity",
    properties: {
        id: { type: Number }
    }
});

const User = compose({
    name: "User",
    extends: Entity,
    properties: {
        name: { type: String }
    }
});

const u = new User();

console.log(p.toJS());

/*
 * {
 *     id: 0,
 *     name: ''
 * }
 */

````

## Item types

That all works fine with Record and primitive types. But what if we need to have a List or a Map with nested Records? ``compose-record`` has a special option for it: ``items``. 
``items`` is a nested type descriptor that informs ``compose-record`` how to wrap the underlying values.
It's optional, by default ``compose-record`` will use a value as it is.

````javascript
import { compose } from 'compose-record';
import { List } from 'immutable';

const User = compose({
    name: 'User',
    properties: {
        name: { type: String }
    }
});

const Group = compose({
    name: 'Group',
    properties: {
        users: { 
            type: List,
            items: {
                type: User
            }
        }
    }
});

const u = new Group({
    users: [
        { name: 'Mike Wazowski' },
        { name: 'James P. Sullivan' }
    ]
});

console.log(p.toJS());

/*
 *    {
 *        users: [
 *            { name: 'Mike Wazowski' },
 *            { name: 'James P. Sullivan' }
 *        ]
 *     }
 */

````

You can build even more complex scenarios:

````javascript
import { compose } from 'compose-record';
import { List, Map } from 'immutable';

const User = compose({
    name: 'User',
    properties: {
        name: { type: String }
    }
});

const Group = compose({
    name: 'Group',
    properties: {
        users: { 
            type: Map,
            items: {
                type: List,
                items: {
                    type: User
                }
            }
        }
    }
});

const u = new Group({
    users: {
        monsters: [
            { name: 'Mike Wazowski' },
            { name: 'James P. Sullivan' }
        ],
        humans: [
            { name: 'Boo' }
        ]
    }
});

console.log(p.toJS());

/*
 * {
 *     users: {
 *         monsters: [
 *             { name: 'Mike Wazowski' },
 *             { name: 'James P. Sullivan' }
 *         ],
 *      humans: [
 *          { name: 'Boo' }
 *      ]
 *   }
 * }
 */

````

**Note:** There is one caveat: It works only for constructors. All further inserts require you to pass an instance of a nested Record. This is a limiation of ```compose-record``` which might be solved in the future.