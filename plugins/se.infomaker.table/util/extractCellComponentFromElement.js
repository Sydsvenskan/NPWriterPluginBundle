import { Component } from 'substance'

export default function(target) {
    return findClosestCellParent(Component.unwrap(target))
}

function findClosestCellParent(comp) {
    if (comp) {
        if (comp._isTableCellComponent) {
            return comp
        } else if (comp.getParent) {
            const candidate = comp.getParent()
            return findClosestCellParent(candidate)
        }
    }
    return null
}
