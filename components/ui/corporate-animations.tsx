'use client'

import React from 'react'
import { cn } from '@/lib/utils'

// Corporate Animation Components

export function CorporateFadeIn({
  children,
  delay = 0,
  className
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <div
      className={cn('animate-in fade-in-0 slide-in-from-bottom-4 duration-500', className)}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

export function CorporateSlideIn({
  children,
  direction = 'up',
  delay = 0,
  className
}: {
  children: React.ReactNode;
  direction?: 'up' | 'down' | 'left' | 'right';
  delay?: number;
  className?: string;
}) {
  const directionClasses = {
    up: 'slide-in-from-bottom-4',
    down: 'slide-in-from-top-4',
    left: 'slide-in-from-right-4',
    right: 'slide-in-from-left-4'
  }

  return (
    <div
      className={cn('animate-in fade-in-0 duration-500', directionClasses[direction], className)}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

export function CorporateScaleIn({
  children,
  delay = 0,
  className
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <div
      className={cn('animate-in fade-in-0 zoom-in-95 duration-300', className)}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

export function CorporateStaggerContainer({
  children,
  staggerDelay = 100,
  className
}: {
  children: React.ReactNode;
  staggerDelay?: number;
  className?: string;
}) {
  return (
    <div className={className}>
      {React.Children.map(children, (child, index) => (
        <CorporateFadeIn key={index} delay={index * staggerDelay}>
          {child}
        </CorporateFadeIn>
      ))}
    </div>
  )
}

export function CorporateHoverLift({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:-translate-y-1', className)}>
      {children}
    </div>
  )
}

export function CorporatePulse({
  children,
  className
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('animate-pulse', className)}>
      {children}
    </div>
  )
}

export function CorporateGlow({
  children,
  color = 'blue',
  className
}: {
  children: React.ReactNode;
  color?: 'blue' | 'green' | 'purple' | 'red';
  className?: string;
}) {
  const glowClasses = {
    blue: 'shadow-blue-500/25 hover:shadow-blue-500/40',
    green: 'shadow-green-500/25 hover:shadow-green-500/40',
    purple: 'shadow-purple-500/25 hover:shadow-purple-500/40',
    red: 'shadow-red-500/25 hover:shadow-red-500/40'
  }

  return (
    <div className={cn('transition-shadow duration-300 hover:shadow-lg', glowClasses[color], className)}>
      {children}
    </div>
  )
}