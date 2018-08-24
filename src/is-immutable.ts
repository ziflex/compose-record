import {
    Iterable,
    List,
    Map,
    OrderedMap,
    OrderedSet,
    Seq,
    Set,
    Stack,
} from 'immutable';

const comparators = [
    List.isList,
    Map.isMap,
    OrderedMap.isOrderedMap,
    Set.isSet,
    OrderedSet.isOrderedSet,
    Stack.isStack,
    Seq.isSeq,
    Iterable.isIterable,
];

export function isImmutable(value: any): boolean {
    if (value == null) {
        return false;
    }

    return comparators.some(i => i(value));
}
