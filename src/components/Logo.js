import React from 'react';

/**
 * Logo de SmartLunch.
 * Puedes usar imagen (logo.png / logo-circular-rojo.png) o icono + texto.
 * Rutas de imágenes en public: /Views/img/logo.png, /Views/img/logo-circular-rojo.png
 *
 * Uso:
 *   <Logo variant="navbar" />   // Barra superior
 *   <Logo variant="login" />     // Pantalla de login
 *   <Logo variant="footer" />    // Pie de página
 *   <Logo variant="navbar" useImage />  // Usar imagen en lugar de icono+texto
 */
const LOGO_IMAGE = '/Views/img/logo.png';
const LOGO_CIRCULAR = '/Views/img/logo-circular-rojo.png';

const Logo = ({
  /** 'navbar' | 'login' | 'footer' - Define tamaño y estilo */
  variant = 'navbar',
  /** Si true, muestra la imagen del logo; si false, icono + texto */
  useImage = false,
  /** Ruta de la imagen (por defecto logo.png). Alternativa: LOGO_CIRCULAR */
  imageSrc = LOGO_IMAGE,
  /** Texto junto al logo cuando useImage es false */
  text = 'SmartLunch',
  className = '',
  style = {},
}) => {
  if (useImage) {
    return (
      <img
        src={imageSrc}
        alt="SmartLunch"
        className={`smartlunch-logo smartlunch-logo--${variant} ${className}`}
        style={{
          height: variant === 'navbar' ? '36px' : variant === 'login' ? '64px' : '32px',
          width: 'auto',
          objectFit: 'contain',
          display: 'block',
          ...style,
        }}
      />
    );
  }

  // Icono + texto (comportamiento actual)
  const isLogin = variant === 'login';
  const isFooter = variant === 'footer';
  const iconSize = isLogin ? '2.5rem' : isFooter ? '1rem' : '1.25rem';
  const textSize = isLogin ? '1.25rem' : isFooter ? '1rem' : '1.25rem';

  return (
    <span
      className={`smartlunch-logo smartlunch-logo--${variant} d-inline-flex align-items-center ${className}`}
      style={{
        gap: isLogin ? '0.5rem' : '0.5rem',
        flexDirection: isLogin ? 'column' : 'row',
        ...style,
      }}
    >
      <i
        className="fa fa-utensils"
        style={{
          margin: 0,
          padding: 0,
          fontSize: iconSize,
          color: isLogin ? 'white' : 'inherit',
        }}
        aria-hidden="true"
      />
      <span
        className={isFooter ? 'text-white' : ''}
        style={{
          marginLeft: 0,
          paddingLeft: 0,
          marginTop: isLogin ? '0.5rem' : 0,
          letterSpacing: 0,
          fontSize: textSize,
          fontWeight: 500,
          color: isLogin ? 'white' : 'inherit',
        }}
      >
        {text}
      </span>
    </span>
  );
};

export default Logo;
export { LOGO_IMAGE, LOGO_CIRCULAR };
