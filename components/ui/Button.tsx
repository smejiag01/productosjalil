import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import Spinner from "./Spinner";
import { buttonClass, type TamanoBoton, type VarianteBoton } from "./clases";

interface PropsComunes {
  variant?: VarianteBoton;
  size?: TamanoBoton;
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  className?: string;
  children?: ReactNode;
}

type PropsBoton = PropsComunes &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof PropsComunes> & { href?: undefined };

type PropsEnlace = PropsComunes & {
  href: string;
  target?: string;
  rel?: string;
  "aria-label"?: string;
  onClick?: () => void;
};

/** Botón del sistema. Con `href` se renderiza como enlace (Next Link) con el mismo aspecto. */
export default function Button(props: PropsBoton | PropsEnlace) {
  const {
    variant = "primary",
    size = "md",
    fullWidth,
    loading,
    leftIcon,
    rightIcon,
    className,
    children,
  } = props;
  const clases = buttonClass({ variant, size, fullWidth, className });
  const contenido = (
    <>
      {loading ? <Spinner size="sm" /> : leftIcon}
      {children}
      {!loading && rightIcon}
    </>
  );

  if (props.href !== undefined) {
    const { href, target, rel, onClick } = props;
    const externo = target === "_blank";
    return (
      <Link
        href={href}
        target={target}
        rel={rel ?? (externo ? "noopener noreferrer" : undefined)}
        aria-label={props["aria-label"]}
        onClick={onClick}
        className={clases}
      >
        {contenido}
      </Link>
    );
  }

  const {
    variant: _v,
    size: _s,
    fullWidth: _f,
    loading: _l,
    leftIcon: _li,
    rightIcon: _ri,
    className: _c,
    children: _ch,
    href: _h,
    type = "button",
    disabled,
    ...resto
  } = props;
  void [_v, _s, _f, _l, _li, _ri, _c, _ch, _h];

  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={clases}
      {...resto}
    >
      {contenido}
    </button>
  );
}
