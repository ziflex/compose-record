import { Map, Record } from 'immutable';
import isArray from 'is-array';
import isPlainObject from 'is-plain-obj';
import reduce from 'reduce';
import { isImmutable } from './is-immutable';

/**
 * @private
 */
const PROPS_KEY = '__@@DESCRIPTORS@@__';

/**
 * @private
 */
const IS_FACTORY_KEY = '__@@FACTORY@@__';

/**
 * @private
 */
function isPrimitiveType(input: any): boolean {
    return input === String ||
        input === Boolean ||
        input === Number;
}

/**
 * @private
 */
function isFactory(type: any): boolean {
    return type[IS_FACTORY_KEY] != null;
}

/**
 * Creates a factory function type.
 * @param input - A factory function.
 * @param - A factory function type.
 */
function createFactory<TDef, TArgs = any>(input: (value?: TArgs) => TDef): TypeFactoryFunction<TDef> {
    const factory = input as TypeFactoryFunction<TDef>;
    factory[IS_FACTORY_KEY] = true;

    return factory;
}

/**
 * @private
 */
function createTypeInstance(type: Type<any>, value?: any): any {
    if (!isPrimitiveType(type)) {
        let rawValue = value;

        if (isImmutable(value)) {
            // unwrap in order to keep data consistency in place
            rawValue = (value as Immutable).toJS();
        }

        if (isFactory(type) === false) {
            const PropertyType = type as Class<any>;

            return new PropertyType(rawValue);
        }

        const propertyFactory = type as TypeFactoryFunction<any>;

        return propertyFactory(rawValue);
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

/**
 * @private
 */
function resolveGenericValue(desc?: TypeDescriptor<any>, value?: any): any {
    if (desc == null) {
        return value;
    }

    if (isArray(value)) {
        return value.map((gValue: any) => {
            if (desc.items == null) {
                return createTypeInstance(desc.type, gValue);
            }

            return createTypeInstance(desc.type, resolveGenericValue(desc.items, gValue));
        });
    }

    if (isPlainObject(value)) {
        return reduce(value, (res: any, gValue: any, gField: string) => {
            const out = res;
            let resolved;

            if (desc.items == null) {
                resolved = createTypeInstance(desc.type, gValue);
            } else {
                resolved = createTypeInstance(desc.type, resolveGenericValue(desc.items, gValue));
            }

            out[gField] = resolved;

            return out;
        },            {});
    }

    if (isImmutable(value)) {
        return resolveGenericValue(desc, (value as Immutable).toJS());
    }

    return value != null ? value : desc.defaultValue;
}

/**
 * @private
 */
function createPropertyInstance(prop: Property<any>, value?: any): any {
    if (prop.items == null || value == null) {
        if (value == null) {
            if (prop.nullable) {
                return null;
            }
        }

        return createTypeInstance(prop.type, value != null ? value : prop.defaultValue);
    }

    return createTypeInstance(prop.type, resolveGenericValue(prop.items, value));
}

/**
 * @private
 */
function getPropertyDescriptors(type: Type<Immutable>): PropertyCollection<any> | undefined {
    return (type as any)[PROPS_KEY];
}

/**
 * @private
 */
function createClass(name: string, props: PropertyCollection<any>, values: any): any {
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
    (RecordType as any).getPropertyDescriptors = function () {
        return getPropertyDescriptors(RecordType);
    };
    // tslint:disable-next-line:max-line-length
    (RecordType as any).createPropertyInstance = function <TRec, TArgs = TRec>(prop: Property<TRec>, value?: TArgs): TRec {
        return createPropertyInstance(prop, value) as TRec;
    };
    RecordType.prototype = _RecordType.prototype;
    RecordType.prototype.constructor = RecordType;

    return RecordType as any;
}

/**
 * Represents an Record class
 * @param TOut - List of properties defined in Record instance
 * @param TIn - List of properties defined as constructor arguments
 */
export interface Class<TOut, TIn = any> {
    [prop: string]: any;
    name: string;
    new (values?: TIn): TOut;
    getPropertyDescriptors(): Readonly<{ [P in keyof TIn]: Property<any> }>;
    createPropertyInstance<POut, PIn = POut>(prop: Property<POut>, value?: PIn): POut & Immutable;
}

/**
 * Represents an immutable data structure
 */
export interface Immutable extends Map<string, any> {}

export interface Values {
    [prop: string]: any;
}

/**
 * Represents a type function
 */
export type TypeFunction<T> = (value?: any) => T;

export interface TypeFactoryFunction<T> {
    [IS_FACTORY_KEY]: boolean;
    (value?: any): T;
}

/**
 * Represents a type
 */
export type Type<T> = Class<T> | TypeFunction<T> | TypeFactoryFunction<T>;

/**
 * Represents a type descriptor
 * @param type - Type constructor that represents a field type
 * @param defaultValue - Type default value
 * @param items - Nested type descriptor used for mapping item values in lists and maps.
 */
export interface TypeDescriptor<T> {
    type: Type<T>;
    defaultValue?: any;
    items?: TypeDescriptor<T>;
}

/**
 * Represents a property descriptor
 * @package nullable - Informs to not create an instance of nested type with default valeus when value is not provided.
 */
export interface Property<T> extends TypeDescriptor<T> {
    nullable?: boolean;
}

/**
 * Represents a collection of Record properties
 * @param @key - Property descriptor
 */
export type PropertyCollection<T> = {
    readonly [P in keyof T]?: Property<any>;
};

/**
 * Represents a list options to create a Record class
 * @param name - Record name
 * @param properties - List of properties
 * @param extends - Record type(s) to extend. All properties from specifed records becomes part of the new one.
 */
export interface ComposeOptions<T> {
    name: string;
    properties?: PropertyCollection<T>;
    extends?: Type<any> | Type<any>[];
}

/** 
 * Creates a deeply nested Record class.
 * @param opts - List of options
 * @returns Record class with defined properties
 */
export function compose<
    TDef,
    TArgs = TDef
>(opts: ComposeOptions<TDef>): Class<TDef extends Immutable ? TDef : TDef & Immutable, TArgs> {
    let propTypes: PropertyCollection<any> = opts.properties ?  { ...(opts.properties as any) } : {};

    if (opts.extends) {
        const ext: Type<any>[] = isArray(opts.extends) ? opts.extends : [opts.extends];

        // iterate over extending types
        ext.forEach((type: Type<Immutable>) => {
            if (!isPrimitiveType(type)) {
                const props = getPropertyDescriptors(type);

                // if it's an immutable, serialize the value and mix with others
                if (props != null) {
                    propTypes = { ...props, ...(propTypes as any) };
                } else {
                    // tslint:disable-next-line:max-line-length
                    console.warn('Passed a non-composed data structure as extending type. Only composed Records are supported.');
                }
            } else {
                console.warn('Passed a primitive type. Primitives cannot extend Record type');
            }
        });
    }

    const propValues = reduce(propTypes, (res: any, prop: Property<any>, name: string) => {
        const out = res;

        // set record prop type
        (propTypes as any)[name] = prop;

        // set prop default value
        out[name] = createTypeInstance(prop.type, prop.defaultValue);

        return out;
    },                        {});

    return createClass(
        opts.name,
        Object.freeze(propTypes),
        propValues,
    );
}

export namespace compose {
    export const factory = createFactory;
}
