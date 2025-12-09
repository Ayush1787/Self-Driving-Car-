class Controls {
    constructor(type = "KEYS") {
        this.forward = false;
        this.left = false;
        this.right = false;
        this.reverse = false;

        if (type === "KEYS") {
            this.init();
        } else if (type === "DUMMY") {
            this.forward = true;
        }
    }

    init() {
        document.addEventListener("keydown", (event) => {
            switch (event.code) {
                case "ArrowUp":
                    this.forward = true;
                    break;
                case "ArrowLeft":
                    this.left = true;
                    break;
                case "ArrowRight":
                    this.right = true;
                    break;
                case "ArrowDown":
                    this.reverse = true;
                    break;
            }
        });

        document.addEventListener("keyup", (event) => {
            switch (event.code) {
                case "ArrowUp":
                    this.forward = false;
                    break;
                case "ArrowLeft":
                    this.left = false;
                    break;
                case "ArrowRight":
                    this.right = false;
                    break;
                case "ArrowDown":
                    this.reverse = false;
                    break;
            }
        });
    }
}
