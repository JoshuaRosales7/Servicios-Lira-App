"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

interface ExportButtonProps {
    data: any[]
    filename?: string
    label?: string
    className?: string
}

export function ExportButton({ data, filename = "data", label = "Exportar", className }: ExportButtonProps) {
    const handleExport = () => {
        if (!data || data.length === 0) return

        // Get headers from first object or default
        // We assume data is already flattened/formatted for export by the parent
        const headers = Object.keys(data[0])

        // Create CSV content
        const csvContent = [
            headers.join(","), // Header row
            ...data.map(row =>
                headers.map(header => {
                    const cell = row[header] === null || row[header] === undefined ? "" : row[header]
                    // Escape quotes and wrap in quotes if contains comma
                    const stringCell = String(cell)
                    return stringCell.includes(",") || stringCell.includes('"')
                        ? `"${stringCell.replace(/"/g, '""')}"`
                        : stringCell
                }).join(",")
            )
        ].join("\n")

        // Trigger download
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
        const link = document.createElement("a")
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob)
            link.setAttribute("href", url)
            link.setAttribute("download", `${filename}.csv`)
            link.style.visibility = "hidden"
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
        }
    }

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className={className}
            disabled={!data || data.length === 0}
        >
            <Download className="mr-2 h-4 w-4" />
            {label}
        </Button>
    )
}
