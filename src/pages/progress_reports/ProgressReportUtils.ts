export function getFormStateItem<T, K extends keyof T>(obj: {[P in keyof T]?: T[P]}, key: K): T[K] | undefined {
    return obj[key];
}