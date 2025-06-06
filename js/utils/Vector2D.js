// Vector2D utility class for 2D vector operations
class Vector2D {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    add(other) {
        return new Vector2D(this.x + other.x, this.y + other.y);
    }

    subtract(other) {
        return new Vector2D(this.x - other.x, this.y - other.y);
    }

    multiply(scalar) {
        return new Vector2D(this.x * scalar, this.y * scalar);
    }

    divide(scalar) {
        if (scalar === 0) return new Vector2D(0, 0); // Evitar divisão por zero
        return new Vector2D(this.x / scalar, this.y / scalar);
    }

    magnitude() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    normalize() {
        const mag = this.magnitude();
        if (mag === 0) return new Vector2D(0, 0);
        return this.divide(mag);
    }

    distance(other) {
        return this.subtract(other).magnitude();
    }

    angle() {
        return Math.atan2(this.y, this.x);
    }

    static fromAngle(angle, magnitude = 1) {
        return new Vector2D(magnitude * Math.cos(angle), magnitude * Math.sin(angle));
    }
}
