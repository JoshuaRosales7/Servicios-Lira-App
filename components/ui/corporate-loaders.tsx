'use client'

import { cn } from '@/lib/utils'

// Modern Corporate Loading Components

export function CorporateSpinner({ className, size = 'default' }: { className?: string; size?: 'sm' | 'default' | 'lg' }) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    default: 'h-5 w-5',
    lg: 'h-6 w-6'
  }

  return (
    <div className={cn('relative', sizeClasses[size], className)}>
      <div className="absolute inset-0 rounded-full border-2 border-slate-200 dark:border-slate-700"></div>
      <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-600 dark:border-t-blue-400 animate-spin"></div>
    </div>
  )
}

export function CorporatePulseLoader({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-2 w-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-pulse"
          style={{ animationDelay: `${i * 0.2}s` }}
        />
      ))}
    </div>
  )
}

export function CorporateWaveLoader({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-end gap-1', className)}>
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="w-1 bg-blue-600 dark:bg-blue-400 rounded-full animate-pulse"
          style={{
            height: `${20 + Math.sin(i * 0.5) * 10}px`,
            animationDelay: `${i * 0.1}s`,
            animationDuration: '1s'
          }}
        />
      ))}
    </div>
  )
}

export function CorporateButtonLoader({ children, loading, className }: {
  children: React.ReactNode;
  loading?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('relative', className)}>
      {children}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-slate-900/80 rounded-md">
          <CorporateSpinner size="sm" />
        </div>
      )}
    </div>
  )
}

export function CorporatePageLoader({ message = 'Cargando...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
      <div className="relative">
        <div className="h-16 w-16 rounded-full border-4 border-slate-200 dark:border-slate-700"></div>
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600 dark:border-t-blue-400 animate-spin"></div>
      </div>
      <div className="text-center space-y-2">
        <p className="text-lg font-medium text-slate-900 dark:text-slate-100">{message}</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">Por favor espera un momento</p>
      </div>
    </div>
  )
}

export function CorporateSkeletonLoader({
  variant = 'card',
  className
}: {
  variant?: 'card' | 'list' | 'table';
  className?: string;
}) {
  if (variant === 'card') {
    return (
      <div className={cn('bg-white dark:bg-slate-900 rounded-xl border border-slate-200/50 dark:border-slate-800/50 p-6 shadow-sm animate-pulse', className)}>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
            <div className="space-y-2 flex-1">
              <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-800 rounded"></div>
              <div className="h-3 w-1/2 bg-slate-200 dark:bg-slate-800 rounded"></div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-3 w-full bg-slate-200 dark:bg-slate-800 rounded"></div>
            <div className="h-3 w-2/3 bg-slate-200 dark:bg-slate-800 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (variant === 'list') {
    return (
      <div className={cn('space-y-3 animate-pulse', className)}>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200/50 dark:border-slate-800/50">
            <div className="h-10 w-10 bg-slate-200 dark:bg-slate-800 rounded"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-800 rounded"></div>
              <div className="h-3 w-1/2 bg-slate-200 dark:bg-slate-800 rounded"></div>
            </div>
            <div className="h-6 w-16 bg-slate-200 dark:bg-slate-800 rounded-full"></div>
          </div>
        ))}
      </div>
    )
  }

  // table variant
  return (
    <div className={cn('bg-white dark:bg-slate-900 rounded-xl border border-slate-200/50 dark:border-slate-800/50 shadow-sm animate-pulse', className)}>
      <div className="border-b border-slate-200 dark:border-slate-800 p-4">
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded"></div>
          ))}
        </div>
      </div>
      <div className="p-0">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="grid grid-cols-4 gap-4 p-4 border-b border-slate-200 dark:border-slate-800 last:border-0">
            {[...Array(4)].map((_, j) => (
              <div key={j} className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded"></div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}