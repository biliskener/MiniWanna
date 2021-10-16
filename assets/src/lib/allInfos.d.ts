declare interface AchievementInfo {
    'id': number,
    'detail': string,
    'conditions': number[],
}

declare interface GlobalInfo {
    'svnRevision': number,
    'test': number,
}

declare interface PropLevelInfo {
    'id': number,
    'type': number,
    'level': number,
    'effect': number,
    'desc': string,
    'upgradePrice': number,
}

declare interface SceneInfo {
    'id': number,
    'name': string,
    'backgroundImage': string,
    'floorImage': string,
    'hangImage': string,
}

declare interface ShopItemInfo {
    'id': number,
    'name': string,
    'desc': string,
    'type': number,
    'subType': number,
    'level': number,
    'unlock': boolean,
    'icon': string,
    'image': string,
    'buyType': number,
    'buyCount': number,
    'price': number,
    'rmbPrice': number,
    'productId': string,
    'buyPrompt': string,
    'rmbBuyPrompt': string,
}

declare type AllInfos = {
    'achievements'?: { [key: number]: AchievementInfo },
    'global'?: GlobalInfo,
    'propLevels'?: { [key: number]: PropLevelInfo },
    'scenes'?: { [key: number]: SceneInfo },
    'shopItems'?: { [key: number]: ShopItemInfo },
}

declare let gAllInfos: AllInfos;