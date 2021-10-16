import { Node, ParticleSystem2D } from "cc";
import { noxcc } from "../core/noxcc";
import { NoxResMgr } from "../mgr/NoxResMgr";

export module ParticleUtil {
    export function createParticle(name: string, autoRemove?: boolean): Node {
        var node = noxcc.newNode();
        var particle = noxcc.getOrAddComponent(node, ParticleSystem2D);
        NoxResMgr.setParticle2DAsync(particle, name, autoRemove || false);
        return node;
    }

    export function setParticle(target: Node | ParticleSystem2D, name: string, autoRemove?: boolean): void {
        NoxResMgr.setParticle2DAsync(target, name, autoRemove || false);
    }
}
