# CHANGELOG

## 1.3.1
### Fixed
* TypeScript error ``factory is referenced directly or indirectly in its own type annotation.``.

## 1.3.0
### Added
* ``factory`` helper function which creates a factory function type.
  ```typescript
    enum Role {
        User,
        Admin,
        Owner,
    }

    interface User {
        username: string;
        role: Role;
    }

    const UserRecord = compose<User>({
        name: 'User',
        properties: {
            username: {
                type: String,
            },
            role: {
                type: compose.factory<Role, string>((value?: string) => {
                    let result = Role.User;

                    switch (value) {
                    case 'user':
                        result = Role.User;
                        break;
                    case 'admin':
                        result = Role.Admin;
                        break;
                    case 'owner':
                        result = Role.Owner;
                        break;
                    }

                    return result;
                }),
            },
        },
    });
  ```






### Fixed
* If a property is boolean and its value is ``false`` default values is used instead.

## 1.2.0

### Added
* Possibility to override type of inherrited properties.

## 1.1.0

### Added
* Type check for passed immutabled structures as values.