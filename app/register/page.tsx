'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'
import { motion } from 'framer-motion' // npm install framer-motion

export default function FichaForm() {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1) // Control de pasos (1: Datos, 2: Banco, 3: Docs)
  const [user, setUser] = useState<any>(null)

  const [formData, setFormData] = useState({
    fecha_nacimiento: '', direccion: '', distrito: '', provincia: '', departamento: '',
    sistema_pension: 'ONP', cuspp: '', banco: '', numero_cuenta: '', cci: '',
    celular_emergencia: '', contacto_emergencia: ''
  })

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [])

  const handleChange = (e: any) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleEnviar = async () => {
    if (!user) return
    setLoading(true)
    
    // Aquí actualizamos la ficha
    const { error } = await supabase.from('fichas').insert({
      user_id: user.id,
      estado: 'completado',
      ...formData
      // NOTA: Para archivos reales, primero debes subirlos a Storage y obtener la URL.
      // Aquí estamos asumiendo envío de datos de texto por simplicidad.
    })

    if (error) {
      toast.error('Error al enviar ficha')
      console.error(error)
    } else {
      toast.success('¡Ficha enviada correctamente!')
      // Opcional: Redirigir o bloquear form
    }
    setLoading(false)
  }

  // Variantes para la animación
  const variants = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 }
  }

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-xl shadow-md my-10">
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Ficha de Obrero</h2>
        <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">Paso {step} de 3</span>
      </div>

      <div className="min-h-[400px]">
        {step === 1 && (
          <motion.div initial="hidden" animate="visible" exit="exit" variants={variants} className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Datos Personales</h3>
            <div className="grid grid-cols-2 gap-4">
               <input type="date" name="fecha_nacimiento" onChange={handleChange} className="border p-2 rounded w-full" placeholder="Fecha Nacimiento" />
               <input name="direccion" onChange={handleChange} className="border p-2 rounded w-full" placeholder="Dirección" />
               <input name="distrito" onChange={handleChange} className="border p-2 rounded w-full" placeholder="Distrito" />
               <input name="provincia" onChange={handleChange} className="border p-2 rounded w-full" placeholder="Provincia" />
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div initial="hidden" animate="visible" exit="exit" variants={variants} className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Datos Bancarios y Pensión</h3>
            <select name="sistema_pension" onChange={handleChange} className="border p-2 rounded w-full">
              <option value="ONP">ONP</option>
              <option value="AFP">AFP</option>
            </select>
            {formData.sistema_pension === 'AFP' && (
               <input name="cuspp" onChange={handleChange} className="border p-2 rounded w-full" placeholder="N° CUSPP" />
            )}
            <input name="banco" onChange={handleChange} className="border p-2 rounded w-full" placeholder="Nombre del Banco" />
            <input name="numero_cuenta" onChange={handleChange} className="border p-2 rounded w-full" placeholder="Número de Cuenta" />
            <input name="cci" onChange={handleChange} className="border p-2 rounded w-full" placeholder="CCI" />
          </motion.div>
        )}

        {step === 3 && (
          <motion.div initial="hidden" animate="visible" exit="exit" variants={variants} className="space-y-4">
            <h3 className="font-semibold text-lg border-b pb-2">Declaración Jurada</h3>
            <div className="bg-yellow-50 p-4 rounded border border-yellow-200 text-sm">
              <p>Confirmo que los datos ingresados son correctos.</p>
              <p>Declaro bajo juramento que toda la información consignada y la documentación adjunta en esta ficha es verdadera.</p>
            </div>
            <label className="flex items-center gap-2 mt-4 cursor-pointer">
              <input type="checkbox" className="w-5 h-5" />
              <span className="font-medium">Acepto los términos</span>
            </label>
            
            <button onClick={handleEnviar} disabled={loading} className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded transition-all">
              {loading ? 'Enviando...' : 'FINALIZAR Y ENVIAR FICHA'}
            </button>
          </motion.div>
        )}
      </div>

      {/* Navegación entre pasos */}
      <div className="flex justify-between mt-6 pt-4 border-t">
        {step > 1 && (
          <button onClick={() => setStep(step - 1)} className="text-gray-600 hover:text-black font-medium">
            ← Atrás
          </button>
        )}
        {step < 3 && (
          <button onClick={() => setStep(step + 1)} className="ml-auto bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
            Siguiente →
          </button>
        )}
      </div>
    </div>
  )
}