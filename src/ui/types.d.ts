export interface PointerDownEvent<T = Element> {
    x: number;
    y: number;
    originalEvent: MouseEvent | TouchEvent | React.MouseEvent<T> | React.TouchEvent<T>;
}

export interface PointerDragEvent<T = Element> {
    prevValue: number;
    x: number;
    y: number;
    fromX: number;
    fromY: number;
    movementX: number;
    movementY: number;
    originalEvent: MouseEvent | TouchEvent | React.MouseEvent<T> | React.TouchEvent<T>;
}

export interface PointerUpEvent<T = Element> {
    x: number;
    y: number;
    originalEvent: MouseEvent | TouchEvent | React.MouseEvent<T> | React.TouchEvent<T>;
}
