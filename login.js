document.addEventListener('DOMContentLoaded', () => {
    const _0x5a3d2b = [
        { usuario: '47604343', contrasena: '123456', nombre: 'SMACHOA' },
        { usuario: '8596585', contrasena: 'Lima2025', nombre: 'Usuario1' },
        { usuario: '8596589', contrasena: 'Lima2025', nombre: 'Usuario2' }
    ];

    const _0x1b7c4e = document.getElementById('login-form');
    const _0x4f8e6a = document.getElementById('usuario');
    const _0x2c9b1f = document.getElementById('contrasena');
    const _0x3e5d7c = document.getElementById('login-error');

    _0x1b7c4e.addEventListener('submit', (_0x1a2b3c) => {
        _0x1a2b3c.preventDefault();

        const _0x4d5e6f = _0x4f8e6a.value;
        const _0x5a6b7c = _0x2c9b1f.value;

        const _0x5f8b2a = _0x5a3d2b.find(_0x3e4d5c =>
            _0x3e4d5c.usuario === _0x4d5e6f && _0x3e4d5c.contrasena === _0x5a6b7c
        );

        if (_0x5f8b2a) {
            sessionStorage.setItem('nombreUsuario', _0x5f8b2a.nombre);
            window.location.href = 'index.html';
        } else {
            _0x3e5d7c.textContent = 'Usuario o contraseña incorrectos.';
            _0x3e5d7c.classList.remove('hidden');
        }
    });
});