declare module "reduce" {
    export default function reduce<TOut, TIn = any>(
        input: TIn,
        acc: (out: TOut, val: any, key: string) => TOut,
        init: TOut
    ): TOut;
}