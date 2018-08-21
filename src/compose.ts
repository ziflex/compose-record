import { Map, Record } from 'immutable';
import isArray from 'is-array';
import isPlainObject from 'is-plain-obj';
import reduce from 'reduce';

const PROPS_KEY = '__@TYPES__';

function isPrimitiveType(input: any): boolean {
    return input === String ||
        input === Boolean ||
        input === Number;
}

function createTypeInstance(type: Type<any>, value?: any): any {
    if (!isPrimitiveType(type)) {
        const PropertyType = type as Class<any>;

        return new PropertyType(value);
    }

    const propertyFactory = type as TypeFunction<any>;

    // it's a primitive value
    // we'll use the factory to validate the type
    if (value) {
        return propertyFactory(value);
    }

    // value is not passed, getting a default value of a primitive type
    return propertyFactory();
}

function createPropertyInstance(prop: Property<any>, value?: any): any {
    if (prop.genericType == null || value == null) {
        if (value == null) {
            if (prop.nullable) {
                return null;
            }
        }

        return createTypeInstance(prop.type, value || prop.defaultValue);
    }

    let genericValue;

    if (isArray(value)) {
        genericValue = value.map(createTypeInstance.bind(null, prop.genericType));
    } else if (isPlainObject(value)) {
        genericValue = reduce(value, (res: any, gValue: any, gField: string) => {
            const out = res;

            out[gField] = createTypeInstance(prop.genericType as Type<any>, gValue);

            return out;
        },                    {});
    }

    return createTypeInstance(prop.type, genericValue);
}

function getTypeProperties(type: Type<Immutable>): PropertyCollection | undefined {
    return (type as any)[PROPS_KEY];
}

function createClass(name: string, props: PropertyCollection, values: any): any {
    const _RecordType = Record(values, name);

    // tslint:disable-next-line:typedef
    function RecordType(v?: Values) {
        const values = reduce(props, (res: any, field: Property<any>, fName: string) => {
            const out = res;

            out[fName] = createPropertyInstance(field, v ? v[fName] : undefined);

            return out;
        },                    {});

        return _RecordType(values);
    }

    (RecordType as any)[PROPS_KEY] = props;
    RecordType.prototype = _RecordType.prototype;
    RecordType.prototype.constructor = RecordType;

    return RecordType as any;
}

export interface Class<TOut = any, TIn = any> {
    [prop: string]: any;
    name: string;
    new (values?: TIn): TOut;
}

export interface Immutable extends Map<string, any> {}

export interface Values {
    [prop: string]: any;
}

export type TypeFunction<T> = (value?: any) => T;
export type Type<T> = Class<T> | TypeFunction<T>;

export interface Property<T> {
    type: Type<T>;
    defaultValue?: any;
    genericType?: Type<T>;
    nullable?: boolean;
}

export interface PropertyCollection {
    [name: string]: Property<any>;
}

export interface ComposeOptions {
    name: string;
    properties?: PropertyCollection;
    extends?: Type<any> | Type<any>[];
}

// tslint:disable-next-line:typedef
export function compose<
    TDef,
    TArgs = TDef
>(opts: ComposeOptions): Class<TDef & Immutable, TArgs> {
    let propTypes: PropertyCollection = opts.properties ?  { ...opts.properties } : {};

    if (opts.extends) {
        const ext: Type<any>[] = isArray(opts.extends) ? opts.extends : [opts.extends];

        // iterate over extending types
        ext.forEach((type: Type<Immutable>) => {
            if (!isPrimitiveType(type)) {
                const props = getTypeProperties(type);

                // if it's an immutable, serialize the value and mix with others
                if (props != null) {
                    propTypes = { ...propTypes, ...props };
                } else {
                    // tslint:disable-next-line:max-line-length
                    console.warn('Passed a non-composed data structure as extending type. Only composed Records are supported.');
                }
            } else {
                console.warn('Passed a primitive type. Primitives cannot extend Record type');
            }
        });
    }

    let propValues: any;

    propValues = reduce(propTypes, (res: any, prop: Property<any>, name: string) => {
        const out = res;

        // set record prop type
        propTypes[name] = prop;

        // set prop default value
        out[name] = prop.defaultValue ? prop.defaultValue : createTypeInstance(prop.type);

        return out;
    },                  {});

    return createClass(
        opts.name,
        propTypes,
        propValues,
    );
}
