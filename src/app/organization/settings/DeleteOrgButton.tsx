'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import ConfirmDeleteOrgModal from '@/components/organization/ConfirmDeleteOrgModal'

export default function DeleteOrgButton({ orgName }: { orgName: string }) {
    const [showModal, setShowModal] = useState(false)

    return (
        <>
            <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors shadow-lg shadow-red-900/20 whitespace-nowrap"
            >
                <Trash2 className="h-4 w-4" />
                Encerrar Conta
            </button>

            {showModal && (
                <ConfirmDeleteOrgModal
                    orgName={orgName}
                    onClose={() => setShowModal(false)}
                />
            )}
        </>
    )
}
