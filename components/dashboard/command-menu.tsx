'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import {
    Calendar,
    CreditCard,
    FileText,
    Home,
    Laptop,
    Moon,
    Plus,
    Settings,
    Sun,
    User,
    Users,
    Scale,
    Landmark,
    UploadCloud,
    Activity
} from 'lucide-react'
import { useTheme } from 'next-themes'

import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
    CommandShortcut,
} from '@/components/ui/command'

export function CommandMenu() {
    const [open, setOpen] = React.useState(false)
    const router = useRouter()
    const { setTheme } = useTheme()

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                setOpen((open) => !open)
            }
        }

        const openEvent = () => setOpen(true)

        document.addEventListener('keydown', down)
        document.addEventListener('command-menu-open', openEvent)

        return () => {
            document.removeEventListener('keydown', down)
            document.removeEventListener('command-menu-open', openEvent)
        }
    }, [])

    const runCommand = React.useCallback((command: () => unknown) => {
        setOpen(false)
        command()
    }, [])

    return (
        <CommandDialog open={open} onOpenChange={setOpen}>
            <CommandInput placeholder="Escribe un comando o busca..." />
            <CommandList>
                <CommandEmpty>No se encontraron resultados.</CommandEmpty>

                <CommandGroup heading="Acciones Rápidas">
                    <CommandItem
                        onSelect={() => runCommand(() => router.push('/dashboard/clients/new'))}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        <span>Nuevo Cliente</span>
                        <CommandShortcut>⌘N</CommandShortcut>
                    </CommandItem>
                    <CommandItem
                        onSelect={() => runCommand(() => router.push('/dashboard/import'))}
                    >
                        <UploadCloud className="mr-2 h-4 w-4" />
                        <span>Importar Documentos</span>
                        <CommandShortcut>⌘U</CommandShortcut>
                    </CommandItem>
                </CommandGroup>

                <CommandSeparator />

                <CommandGroup heading="Navegación">
                    <CommandItem
                        onSelect={() => runCommand(() => router.push('/dashboard'))}
                    >
                        <Home className="mr-2 h-4 w-4" />
                        <span>Panel Principal</span>
                    </CommandItem>
                    <CommandItem
                        onSelect={() => runCommand(() => router.push('/dashboard/clients'))}
                    >
                        <Users className="mr-2 h-4 w-4" />
                        <span>Clientes</span>
                    </CommandItem>
                    <CommandItem
                        onSelect={() => runCommand(() => router.push('/dashboard/documents'))}
                    >
                        <FileText className="mr-2 h-4 w-4" />
                        <span>Documentos</span>
                    </CommandItem>
                    <CommandItem
                        onSelect={() => runCommand(() => router.push('/dashboard/legal'))}
                    >
                        <Scale className="mr-2 h-4 w-4" />
                        <span>Legal y Trámites</span>
                    </CommandItem>
                    <CommandItem
                        onSelect={() => runCommand(() => router.push('/dashboard/fiscal'))}
                    >
                        <CreditCard className="mr-2 h-4 w-4" />
                        <span>Fiscal e Impuestos</span>
                    </CommandItem>
                    <CommandItem
                        onSelect={() => runCommand(() => router.push('/dashboard/banking'))}
                    >
                        <Landmark className="mr-2 h-4 w-4" />
                        <span>Bancario</span>
                    </CommandItem>
                    <CommandItem
                        onSelect={() => runCommand(() => router.push('/dashboard/activity'))}
                    >
                        <Activity className="mr-2 h-4 w-4" />
                        <span>Actividad</span>
                    </CommandItem>
                </CommandGroup>

                <CommandSeparator />

                <CommandGroup heading="Configuración">
                    <CommandItem
                        onSelect={() => runCommand(() => router.push('/dashboard/settings'))}
                    >
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Ajustes</span>
                    </CommandItem>
                    <CommandItem
                        onSelect={() => runCommand(() => router.push('/dashboard/profile'))}
                    >
                        <User className="mr-2 h-4 w-4" />
                        <span>Perfil</span>
                    </CommandItem>
                </CommandGroup>

                <CommandSeparator />

                <CommandGroup heading="Tema">
                    <CommandItem onSelect={() => runCommand(() => setTheme('light'))}>
                        <Sun className="mr-2 h-4 w-4" />
                        <span>Modo Claro</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => setTheme('dark'))}>
                        <Moon className="mr-2 h-4 w-4" />
                        <span>Modo Oscuro</span>
                    </CommandItem>
                    <CommandItem onSelect={() => runCommand(() => setTheme('system'))}>
                        <Laptop className="mr-2 h-4 w-4" />
                        <span>Sistema</span>
                    </CommandItem>
                </CommandGroup>
            </CommandList>
        </CommandDialog>
    )
}
