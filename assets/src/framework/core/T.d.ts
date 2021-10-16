import { AudioClip, Color, HorizontalTextAlignment, Prefab, SpriteFrame, VerticalTextAlignment } from "cc";

declare type TMap<V> = { [key: string]: V };
declare type TArray<V> = V[];
declare type TFunc0<R> = () => R;
declare type TFunc1<R, A1> = (a1: A1) => R;
declare type TFunc2<R, A1, A2> = (a1: A1, a2: A2) => R;
declare type TFunc3<R, A1, A2, A3> = (a1: A1, a2: A2, a3: A3) => R;

declare type TMap1<V> = { [key: number]: V };

declare type LabelParam = {
    family?: string,
    size?: number,
    width?: number,
    height?: number,
    horzAlign?: HorizontalTextAlignment,
    vertAlign?: VerticalTextAlignment,
    wrap?: boolean,
    color?: Color,
}

declare type RichTextParam = {
    family?: string,
    size?: number,
    width?: number,
    color?: Color,
    boldColor?: Color,
    callback?: () => void,
};

declare type AssetsTable = {
    spriteFrames?: { [key: string]: SpriteFrame },
    audioClips?: { [key: string]: AudioClip },
    prefabs?: { [key: string]: Prefab },
}
