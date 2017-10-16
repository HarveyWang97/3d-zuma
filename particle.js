function Particle(speed, initPosition) {
    this.speed = translate(speed);
    this.trans = translate(initPosition);
    this.size = scalem(0.07, 0.07, 0.07);
    this.getTransform = function() {
        this.trans = mult(this.speed, this.trans);
        return mult(this.trans, this.size);
    }
}

function ParticleSystem(center, quantity, lasting_time, color) {
    this.particles = [];
    this.color = color;
    var particles_pos = [];
    this.time_left = lasting_time;
    for (var i = 0; i < quantity; i++) {
        var theta = 2*Math.PI*Math.random();
        var omega = 2*Math.PI*Math.random();
        var a = 2*(Math.random()*0.5+0.5)*Math.cos(theta)*Math.sin(omega);
        var b = 2*(Math.random()*0.5+0.5)*Math.sin(theta)*Math.sin(omega);
        var c = 2*(Math.random()*0.5+0.5)*Math.cos(omega);
        particles_pos.push(vec3(a, b, c));
    }
    for (var i = 0; i < quantity; i++) {
        var pos_transform = add(particles_pos[i], center);
        var speed_vector = normalize(particles_pos[i]);
        this.particles.push(new Particle(scale(0.1, speed_vector), pos_transform));
    }
    this.finished = function() {
        if (this.time_left <= 0) {
            return true;
        } else
            return false;
    }
    this.render = function(camera) {
        for (var i = 0; i < this.particles.length; i++) {
            renderACube(mult(camera, this.particles[i].getTransform()), 0, this.color);
        }
        this.time_left -= 1;
    }
}
