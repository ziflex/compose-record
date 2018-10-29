# CHANGELOG

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

## 1.2.0

### Added
* Possibility to override type of inherrited properties.

## 1.1.0

### Added
* Type check for passed immutabled structures as values.