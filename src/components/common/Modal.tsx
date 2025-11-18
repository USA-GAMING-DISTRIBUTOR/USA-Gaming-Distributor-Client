import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import Button from './Button';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlayClick?: boolean;
  showCloseButton?: boolean;
  /** Optional subtitle shown below title (used by themed header) */
  subtitle?: string;
  /** Header variant for themed headers like Customer modal */
  headerVariant?: 'default' | 'themed';
  /** Color of themed header and color accents */
  headerColor?: 'pink' | 'blue' | 'green' | 'red';
  /** Overlay style - 'dark' uses opaque black, 'blur' uses blurred white overlay like Add Customer modal */
  overlayVariant?: 'dark' | 'blur';
}

/**
 * Reusable Modal component with accessibility features
 */
const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  closeOnOverlayClick = true,
  showCloseButton = true,
  subtitle,
  headerVariant = 'default',
  headerColor = 'pink',
  overlayVariant = 'dark',
}) => {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-7xl mx-4',
  };

  const handleOverlayClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget && closeOnOverlayClick) {
      onClose();
    }
  };

  const overlayClass =
    overlayVariant === 'blur' ? 'bg-white/10 backdrop-blur-sm' : 'bg-black bg-opacity-50';

  const headerColorMap: Record<
    string,
    { from: string; to: string; subtitle: string; close: string }
  > = {
    pink: {
      from: 'from-pink-600',
      to: 'to-pink-700',
      subtitle: 'text-pink-100',
      close: 'text-pink-100 hover:text-white',
    },
    blue: {
      from: 'from-blue-600',
      to: 'to-blue-700',
      subtitle: 'text-blue-100',
      close: 'text-blue-100 hover:text-white',
    },
    green: {
      from: 'from-green-600',
      to: 'to-green-700',
      subtitle: 'text-green-100',
      close: 'text-green-100 hover:text-white',
    },
    red: {
      from: 'from-red-600',
      to: 'to-red-700',
      subtitle: 'text-red-100',
      close: 'text-red-100 hover:text-white',
    },
  };

  const pickedHeaderColor = headerColorMap[headerColor] ?? headerColorMap.pink;

  return (
    <div
      className={`fixed inset-0 ${overlayClass} flex items-center justify-center p-4 z-50`}
      onClick={handleOverlayClick}
    >
      <div
        className={`bg-white rounded-lg shadow-xl w-full ${sizeClasses[size]} max-h-[90vh] flex flex-col`}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div
            className={`${
              headerVariant === 'themed'
                ? `bg-gradient-to-r ${pickedHeaderColor.from} ${pickedHeaderColor.to} text-white p-6 flex-shrink-0`
                : 'flex items-center justify-between p-6 border-b border-gray-200'
            }`}
          >
            <div>
              <h2
                className={`${headerVariant === 'themed' ? 'text-xl font-bold' : 'text-xl font-semibold text-gray-900'}`}
              >
                {title}
              </h2>
              {subtitle && headerVariant === 'themed' && (
                <p className={`${pickedHeaderColor.subtitle} text-sm mt-1`}>{subtitle}</p>
              )}
            </div>
            {showCloseButton && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className={
                  headerVariant === 'themed'
                    ? pickedHeaderColor.close
                    : 'text-gray-400 hover:text-gray-600'
                }
              >
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
};

export default Modal;
