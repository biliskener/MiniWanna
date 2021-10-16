// 声音模块

import { AudioClip, AudioSource, InstancedBuffer, Node } from "cc";
import { cc_assert, CC_DEBUG, cc_log, nox } from "./nox";
import { noxcc } from "./noxcc";
import { noxScheduler } from "./noxScheduler";
import { noxTime } from "./noxTime";

export module noxSound {
    enum AudioClipState {
        unloaded = 0,
        loading = 1,
        loaded = 2,
        error = 3,
    }

    interface MusicEvent {
    }

    interface EffectEvent {
        isLoop: boolean,
        isPaused: boolean,
        playInstanceId: number,
        volume: number,
    }

    export interface AudioClipInfo {
        name: string,
        state: AudioClipState,
        clip: AudioClip | null,
        isMusic: boolean,
        effectEvents: EffectEvent[],
        musicEvents: MusicEvent[],
        effects: number[],
        musics: number[],
        visitTime: number,
    }

    let mTargetNode: Node = null as any as Node;

    let mMusicOn: boolean = true;
    let mEffectOn: boolean = true;
    let mMuteLockCount: number = 0;
    let mMusicList: string[] = [];
    let mMusicGaps: [number, number] = [-1, -1];
    let mMusicVolume: number = 1;
    let mMusicName: string = "";
    let mMusicTimerId: noxScheduler.TimerID | null = null;
    let mMusicLoop: boolean = true;
    let mMusicPaused: boolean = false;

    let mAllAudioClips: { [key: string]: AudioClipInfo } = {};  // 所有的音效的AudioClip, { Name : {clip: cc.AudioClip, state: int, name: string, musicEvents: [{}], soundEvents: [{}], effects: [AudioId], musics: [AudioId] } }
    let mCurrentMusicAudioId: number = -1;

    let mSource2PlayInstance: { [key: string]: number } = {};       // 每一个通道对应的播放实例ID
    let mSource2PlayIsEffect: { [key: string]: boolean } = {};      // 每一个通道对应是否为音乐
    let mSource2PlayIsLoop: { [key: string]: boolean } = {};        // 每一个通道对应是否为循环
    let mPlayInstance2Source: { [key: string]: number } = {};       // 每一个播放实例对应的通道ID
    let mPlayInstance2State: { [key: string]: number } = {};        // 每个播放实例的状态
    let mPlayInstance2Duration: { [key: string]: number } = {};     // 每一个播放实例对应的时长
    let mPlayInstance2Callback: { [key: string]: () => any } = {};  // 每一个播放实例对应的通道ID
    let mAudioSources: AudioSource[] = [];                          // 播放通道列表
    let mNextPlayInstanceId: number = 1;                            // 下一个播放实例ID, 播放实例ID会自增

    let log = CC_DEBUG && false ? () => { } : cc_log;

    export function init(node: Node) {
        mTargetNode = node;
        noxScheduler.scheduleUpdate(function (dt) {
            update(dt);
        }, 0);
        noxScheduler.scheduleInterval(function () {
            clearUnusedAudioClips(CC_DEBUG ? 2 : 10, CC_DEBUG ? 0 : 10);
        }, CC_DEBUG ? 2 : 10);
    }


    // 播放特定的背景音乐
    export function playBgWithSoundNames(list: string[], gaps?: [number, number], volume?: number, isLoop?: boolean): void {
        stopBackgroundSound();
        mMusicList = list;
        mMusicGaps = gaps || [0, 0];
        mMusicVolume = volume ?? 1.0;
        mMusicLoop = isLoop ?? true;
        if (mMusicOn) {
            nextRandomMusic(0);
        }
    }

    // 停止背景音乐
    export function stopBackgroundSound(): void {
        stopCurrentMusic();
        mMusicList = [];
        mMusicGaps = [-1, -1];
        mMusicVolume = 1;
    }

    // 停止当前播放的音乐
    function stopCurrentMusic(): void {
        // 删除定时器
        if (mMusicTimerId) {
            noxScheduler.unscheduleTimeout(mMusicTimerId);
            mMusicTimerId = null;
        }

        // 清空音乐事件列表
        if (mMusicName != "") {
            let audioClipInfo = mAllAudioClips[mMusicName];
            if (audioClipInfo) {
                audioClipInfo.musicEvents = [];
                audioClipInfo.musics = [];
            }
            mMusicName = "";
        }

        // 停止播放
        if (mCurrentMusicAudioId >= 0) {
            // 必须先将mCurrentMusicAudioId置为null
            __stopMusic(mCurrentMusicAudioId);
            mCurrentMusicAudioId = -1;
        }
    }

    // 暂停当前播放的音乐
    export function pauseCurrentMusic(): void {
        mMusicPaused = true;
        if (mCurrentMusicAudioId >= 0) {
            __pauseMusic(mCurrentMusicAudioId);
        }
    }

    // 恢复当前播放的音乐
    export function resumeCurrentMusic(): void {
        mMusicPaused = false;
        if (mCurrentMusicAudioId >= 0) {
            __resumeMusic(mCurrentMusicAudioId);
        }
    }

    function nextRandomMusic(delay?: number): void {
        if (mMusicList.length > 0) {
            if (delay == null) {
                delay = nox.randomI(mMusicGaps[0], mMusicGaps[1]);
            }
            let musicName = nox.getRandomItem(mMusicList) as string;
            mMusicTimerId = noxScheduler.scheduleTimeout(function () {
                mMusicTimerId = null;
                mMusicName = musicName;
                let event: MusicEvent = {
                    isLoop: mMusicLoop,
                };
                let audioClipInfo = loadAudioClip(musicName, true);
                audioClipInfo.musicEvents = [];
                audioClipInfo.musicEvents.push(event);
                processAudioEvents(audioClipInfo);
            }, delay);
        }
    }

    // 设置音乐是否开启
    export function setMusicOn(isOn: boolean): void {
        mMusicOn = isOn;
        if (mMusicOn) {
            if (mMusicName == "") {
                nextRandomMusic();
            }
        }
        else {
            stopCurrentMusic();
        }
    }

    // 音乐是否开启
    export function isMusicOn(): boolean {
        return mMusicOn;
    }

    // 播放特定的音效
    export function playEffect(soundName: string, volume?: number, isLoop?: boolean): number {
        if (mEffectOn) {
            let event: EffectEvent = {
                volume: volume ?? 1.0,
                isLoop: isLoop || false,
                playInstanceId: mNextPlayInstanceId++,
                isPaused: false,
            };
            let audioClipInfo = loadAudioClip(soundName, false);
            audioClipInfo.effectEvents.push(event);
            processAudioEvents(audioClipInfo);
            return event.playInstanceId;
        }
        return 0;
    }

    // 关闭特定的特效
    export function stopEffect(name: string) {
        let audioClipInfo = mAllAudioClips[name];
        if (audioClipInfo) {
            audioClipInfo.effectEvents = [];
            let clips = audioClipInfo.effects.slice(0);
            for (let i = 0; i < clips.length; ++i) {
                __stopEffect(clips[i]);
            }
            audioClipInfo.effects = [];
        }
    }

    // 暂停音效
    export function pauseEffect(name: string) {
        let audioClipInfo = mAllAudioClips[name];
        if (audioClipInfo) {
            for (var i = 0; i < audioClipInfo.effectEvents.length; ++i) {
                var event = audioClipInfo.effectEvents[i];
                event.isPaused = true;
            }
            let clips = audioClipInfo.effects.slice(0);
            for (let i = 0; i < clips.length; ++i) {
                __pauseEffect(clips[i]);
            }
        }
    }

    // 恢复音效
    export function resumeEffect(name: string) {
        let audioClipInfo = mAllAudioClips[name];
        if (audioClipInfo) {
            for (var i = 0; i < audioClipInfo.effectEvents.length; ++i) {
                var event = audioClipInfo.effectEvents[i];
                event.isPaused = false;
            }
            let clips = audioClipInfo.effects.slice(0);
            for (let i = 0; i < clips.length; ++i) {
                __resumeEffect(clips[i]);
            }
        }
    }

    // 停止所有的音效
    export function stopAllEffects(): void {
        for (let name in mAllAudioClips) {
            let audioClipInfo = mAllAudioClips[name];
            audioClipInfo.effectEvents = [];
            let clips = audioClipInfo.effects.slice(0);
            for (let i = 0; i < clips.length; ++i) {
                __stopEffect(clips[i]);
            }
            audioClipInfo.effects = [];
        }
    }

    export function setEffectOn(isOn: boolean): void {
        mEffectOn = isOn;
        if (!mEffectOn) {
            stopAllEffects();
        }
    }

    export function isEffectOn(): boolean {
        return mEffectOn;
    }

    export function lockMute(): void {
        if (mMuteLockCount++ == 0) {
            checkMuteStates();
        }
    }

    export function unlockMute(): void {
        if (--mMuteLockCount == 0) {
            checkMuteStates();
        }
    }

    export function checkMuteStates(): void {
        for (var key in mAllAudioClips) {
            var audioClipInfo = mAllAudioClips[key];
            for (var i = 0; i < audioClipInfo.effects.length; ++i) {
                var audioId = audioClipInfo.effects[i];
                __setVolume(audioId, mMuteLockCount > 0 ? 0 : 1);
            }
            for (var i = 0; i < audioClipInfo.musics.length; ++i) {
                var audioId = audioClipInfo.musics[i];
                __setVolume(audioId, mMuteLockCount > 0 ? 0 : 1);
            }
        }
    }

    // 装载声音资源
    export function loadAudioClip(soundName: string, isMusic: boolean): AudioClipInfo {
        let audioClipInfo = mAllAudioClips[soundName];
        if (!audioClipInfo) {
            mAllAudioClips[soundName] = audioClipInfo = {
                name: soundName,
                state: AudioClipState.unloaded,
                clip: null,
                effectEvents: [],
                musicEvents: [],
                effects: [],
                isMusic: false,
                musics: [],
                visitTime: 0,
            };
        }

        audioClipInfo.visitTime = noxTime.getRunningTime();

        if (audioClipInfo.state == AudioClipState.unloaded) {
            audioClipInfo.state = AudioClipState.loading;
            noxcc.loadAudioClip(soundName, function (err: Error | null, audioClip: AudioClip) {
                if (audioClip instanceof AudioClip) {
                    if (audioClipInfo.state == AudioClipState.loading) { // 不在此状态时就代表被卸载了
                        audioClipInfo.state = AudioClipState.loaded;
                        audioClipInfo.clip = audioClip;
                        processAudioEvents(audioClipInfo);
                    }
                }
                else {
                    audioClipInfo.state = AudioClipState.error;
                    CC_DEBUG && nox.error("load sound failed: ", audioClipInfo.name);
                }
            });
        }
        else if (audioClipInfo.state == AudioClipState.loading) {
        }
        else if (audioClipInfo.state == AudioClipState.error) {
        }
        else {
            processAudioEvents(audioClipInfo);
        }
        return audioClipInfo;
    }

    // 卸载声音资源, 会导致声音停止
    export function unloadAudioClip(soundName: string) {
        stopEffect(soundName);
        if (mMusicName == soundName) {
            stopBackgroundSound();
        }
        let audioClipInfo = mAllAudioClips[soundName];
        if (audioClipInfo) {
            if (audioClipInfo.clip) {
                noxcc.releaseAsset(audioClipInfo.clip);
                audioClipInfo.clip = null;
            }
            audioClipInfo.state = AudioClipState.unloaded;
        }
    }

    // 处理事件
    function processAudioEvents(audioClipInfo: AudioClipInfo): void {
        if (audioClipInfo && audioClipInfo.state == AudioClipState.loaded) {
            if (mEffectOn && audioClipInfo.clip) {
                for (let i = 0; i < audioClipInfo.effectEvents.length; ++i) {
                    let event = audioClipInfo.effectEvents[i];
                    let audioId = __playEffect(audioClipInfo.clip, event.playInstanceId, event.isLoop);
                    if (event.isPaused) {
                        __pauseEffect(audioId);
                    }
                    __setVolume(audioId, mMuteLockCount > 0 ? 0 : event.volume);
                    audioClipInfo.effects.push(audioId);
                    __setFinishCallback(audioId, function () {
                        audioClipInfo.visitTime = noxTime.getRunningTime();
                        nox.removeUniqueItem(audioClipInfo.effects, audioId);
                    });
                }
            }
            if (mMusicOn && audioClipInfo.clip) {
                for (let i = 0; i < audioClipInfo.musicEvents.length; ++i) {
                    let event = audioClipInfo.musicEvents[i];
                    let audioId = __playMusic(audioClipInfo.clip, false);
                    __setVolume(audioId, mMuteLockCount > 0 ? 0 : mMusicVolume);
                    audioClipInfo.musics.push(audioId);
                    mCurrentMusicAudioId = audioId;
                    if (mMusicPaused) {
                        __pauseMusic(mCurrentMusicAudioId);
                    }
                    __setFinishCallback(audioId, function () {
                        audioClipInfo.visitTime = noxTime.getRunningTime();
                        nox.removeUniqueItem(audioClipInfo.musics, audioId);
                        if (mCurrentMusicAudioId == audioId) {
                            mCurrentMusicAudioId = -1;
                            if (mMusicLoop) {
                                nextRandomMusic();
                            }
                        }
                    });
                }
            }
            audioClipInfo.effectEvents = [];
            audioClipInfo.musicEvents = [];
        }
    }

    // 清除所有未使用到的资源
    export function clearUnusedAudioClips(expiredTime: number, keepCount: number): void {
        //log("----- clearUnusedAudioClips begin");
        expiredTime = expiredTime || 0;
        keepCount = keepCount || 0;

        let allAudioClipCount = nox.tableSize(mAllAudioClips);
        let allAudioClips = nox.grep(nox.values(mAllAudioClips), function (audioClipInfo) {
            return audioClipInfo.state == AudioClipState.loaded
                && audioClipInfo.effects.length == 0 && audioClipInfo.effectEvents.length == 0
                && audioClipInfo.musics.length == 0 && audioClipInfo.musicEvents.length == 0;
        });
        allAudioClips.sort(function (a, b) {
            if (a.isMusic == b.isMusic) {
                return -(a.visitTime - b.visitTime);
            }
            return a.isMusic ? -1 : 1;
        });
        let now = noxTime.getRunningTime();
        for (let i = 0; i < allAudioClips.length; ++i) {
            let audioClipInfo = allAudioClips[i];
            if (audioClipInfo.isMusic ||
                now - audioClipInfo.visitTime >= expiredTime && i < allAudioClips.length - keepCount) {
                if (audioClipInfo.clip) {
                    //log(`  --- clear audio clip: ${audioClipInfo.name}`);
                    noxcc.releaseAsset(audioClipInfo.clip);
                    delete mAllAudioClips[audioClipInfo.name];
                }
            }
        }
        //log(`  --- remain audio clip count: ${nox.tableSize(mAllAudioClips)}`);
        //log("----- clearUnusedAudioClips end");
    }

    export function __playClip(clip: AudioClip, playInstanceId: number, isEffect: boolean, isLoop: boolean): number {
        var audioSource: AudioSource = null as any as AudioSource;
        var audioSourceIndex: number = -1;
        for (var i = 0; i < mAudioSources.length; ++i) {
            if (mSource2PlayInstance[i] == null) {
                audioSource = mAudioSources[i];
                audioSourceIndex = i;
                break;
            }
        }
        if (audioSource == null) {
            audioSource = mTargetNode.addComponent(AudioSource);
            mAudioSources.push(audioSource);
            audioSourceIndex = mAudioSources.length - 1;
        }

        audioSource.clip = clip;
        audioSource.loop = isLoop;
        audioSource.playOnAwake = true;
        audioSource.play();

        mPlayInstance2Source[playInstanceId] = audioSourceIndex;
        mPlayInstance2State[playInstanceId] = 0;
        mPlayInstance2Duration[playInstanceId] = 0;
        mSource2PlayInstance[audioSourceIndex] = playInstanceId;
        mSource2PlayIsEffect[audioSourceIndex] = isEffect;
        mSource2PlayIsLoop[audioSourceIndex] = isLoop;

        return playInstanceId;
    }

    export function __stopClip(playInstanceId: number, notify: boolean) {
        var audioSourceIndex = mPlayInstance2Source[playInstanceId];
        if (audioSourceIndex != null) {
            var audioSource = mAudioSources[audioSourceIndex];
            var callback = mPlayInstance2Callback[playInstanceId];
            audioSource.stop();
            //audioSource.clip = null; 此行会导致奇怪的问题
            delete mPlayInstance2Source[playInstanceId];
            delete mPlayInstance2State[playInstanceId];
            delete mPlayInstance2Duration[playInstanceId];
            delete mPlayInstance2Callback[playInstanceId];
            delete mSource2PlayInstance[audioSourceIndex];
            delete mSource2PlayIsEffect[audioSourceIndex];
            delete mSource2PlayIsLoop[audioSourceIndex];
            if (notify) {
                callback && callback();
            }
        }
        else {
            cc_assert(false);
        }
    }

    export function __pauseClip(playInstanceId: number) {
        var audioSourceIndex = mPlayInstance2Source[playInstanceId];
        if (audioSourceIndex != null) {
            var audioSource = mAudioSources[audioSourceIndex];
            audioSource.pause();
        }
        else {
            cc_assert(false);
        }
    }

    export function __resumeClip(playInstanceId: number) {
        var audioSourceIndex = mPlayInstance2Source[playInstanceId];
        if (audioSourceIndex != null) {
            var audioSource = mAudioSources[audioSourceIndex];
            audioSource.play();
        }
        else {
            cc_assert(false);
        }
    }

    export function __setClipVolume(playInstanceId: number, volume: number) {
        var audioSourceIndex = mPlayInstance2Source[playInstanceId];
        if (audioSourceIndex != null) {
            var audioSource = mAudioSources[audioSourceIndex];
            audioSource.volume = volume;
        }
        else {
            cc_assert(false);
        }
    }

    export function __playMusic(clip: AudioClip, isLoop: boolean): number {
        /*
        var audioSource: AudioSource = null as any as AudioSource;
        var audioSourceIndex: number = -1;
        for (var i = 0; i < mAudioSources.length; ++i) {
            if (mSource2PlayInstance[i] != null) {
                audioSource = mAudioSources[i];
                audioSourceIndex = i;
                break;
            }
        }
        if (audioSource == null) {
            audioSource = mTargetNode.addComponent(AudioSource);
            mAudioSources.push(audioSource);
            audioSourceIndex = mAudioSources.length - 1;
        }

        audioSource.clip = clip;
        audioSource.loop = isLoop;
        audioSource.play();

        var playInstanceId = mNextPlayInstanceId++;
        mPlayInstance2Source[playInstanceId] = audioSourceIndex;
        mSource2PlayInstance[audioSourceIndex] = playInstanceId;

        return audioSourceIndex;
        */
        return __playClip(clip, mNextPlayInstanceId++, false, isLoop);
    }

    export function __stopMusic(playInstanceId: number) {
        /*
        var audioSourceIndex = mPlayInstance2Source[playInstanceId];
        if (audioSourceIndex != null) {
            var audioSource = mAudioSources[audioSourceIndex];
            audioSource.stop();
            audioSource.clip = null;
            delete mPlayInstance2Source[playInstanceId];
            delete mSource2PlayInstance[audioSourceIndex];
        }
        else {
            cc_assert(false);
        }
        */
        return __stopClip(playInstanceId, false);
    }

    export function __pauseMusic(playInstanceId: number) {
        /*
        var audioSourceIndex = mPlayInstance2Source[playInstanceId];
        if (audioSourceIndex != null) {
            var audioSource = mAudioSources[audioSourceIndex];
            audioSource.pause();
        }
        else {
            cc_assert(false);
        }
        */
        return __pauseClip(playInstanceId);
    }

    export function __resumeMusic(playInstanceId: number) {
        /*
        var audioSourceIndex = mPlayInstance2Source[playInstanceId];
        if (audioSourceIndex != null) {
            var audioSource = mAudioSources[audioSourceIndex];
            audioSource.play();
        }
        else {
            cc_assert(false);
        }
        */
        return __resumeClip(playInstanceId);
    }

    export function __playEffect(clip: AudioClip, playInstanceId: number, isLoop: boolean): number {
        return __playClip(clip, playInstanceId, true, isLoop);
    }

    export function __stopEffect(playInstanceId: number) {
        return __stopClip(playInstanceId, false);
    }

    export function __pauseEffect(playInstanceId: number) {
        return __pauseClip(playInstanceId);
    }

    export function __resumeEffect(playInstanceId: number) {
        return __resumeClip(playInstanceId);
    }

    export function __setVolume(playInstanceId: number, volume: number) {
        return __setClipVolume(playInstanceId, volume);
    }

    export function __setFinishCallback(playInstanceId: number, callback: () => any) {
        mPlayInstance2Callback[playInstanceId] = callback;
    }

    export function update(dt: number) {
        for (var audioSourceIndex = 0; audioSourceIndex < mAudioSources.length; ++audioSourceIndex) {
            var audioSource = mAudioSources[audioSourceIndex];
            var playInstanceId = mSource2PlayInstance[audioSourceIndex];
            if (playInstanceId != null) {
                mPlayInstance2Duration[playInstanceId] += dt;
                var state = audioSource.state;
                if (state == AudioSource.AudioState.STOPPED && mPlayInstance2Duration[playInstanceId] > 1.0) {
                    __stopClip(playInstanceId, true);
                }
                else if (state == AudioSource.AudioState.PLAYING) {
                    mPlayInstance2State[playInstanceId] = 1;
                }
                else if (state == AudioSource.AudioState.INIT /*&& mPlayInstance2Duration[playInstanceId] > 1.0*/) {
                    __stopClip(playInstanceId, true);
                }
                else if (state == AudioSource.AudioState.INTERRUPTED) {
                    __stopClip(playInstanceId, true);
                }
            }
        }
    }

    export function setMusicVolume(value: number) {
        //!!
    }

    export function playMusic(audioClip: AudioClip, isLoop: boolean) {
        //!!
    }

    export function stopMusic() {
        //!!
    }

    export function play(audioClip: AudioClip) {
        //!!
    }
}
