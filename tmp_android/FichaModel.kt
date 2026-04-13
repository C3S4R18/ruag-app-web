@file:OptIn(kotlinx.serialization.InternalSerializationApi::class)

package com.ruag.digital.data

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.builtins.ListSerializer
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.JsonTransformingSerializer

@Serializable
data class Ficha(
    val id: String? = null,
    @SerialName("user_id") val userId: String = "",

    // --- DATOS PERSONALES ---
    val nombres: String? = null,
    @SerialName("apellido_paterno") val apellidoPaterno: String? = null,
    @SerialName("apellido_materno") val apellidoMaterno: String? = null,
    val dni: String? = null,
    @SerialName("fecha_nacimiento") val fechaNacimiento: String? = null,
    val celular: String? = null,
    val correo: String? = null,
    val direccion: String? = null,
    val distrito: String? = null,
    val provincia: String? = null,
    val departamento: String? = null,

    // --- DATOS BANCARIOS ---
    val banco: String? = null,
    @SerialName("numero_cuenta") val numeroCuenta: String? = null,
    val cci: String? = null,
    @SerialName("sistema_pension") val sistemaPension: String? = null,
    @SerialName("afp_nombre") val afpNombre: String? = null,
    val cuspp: String? = null,

    // --- DATOS LABORALES ---
    val cargo: String? = null,
    @SerialName("nombre_obra") val nombreObra: String? = null,
    val categoria: String? = null,
    @SerialName("fecha_ingreso") val fechaIngreso: String? = null,
    @SerialName("nivel_educacion") val nivelEducacion: String? = null,
    val carrera: String? = null,
    val universidad: String? = null,

    // --- EMERGENCIA ---
    @SerialName("emergencia_nombre") val emergenciaNombre: String? = null,
    @SerialName("emergencia_relacion") val emergenciaRelacion: String? = null,
    @SerialName("emergencia_celular") val emergenciaCelular: String? = null,

    // --- FAMILIA (CORREGIDO CON SERIALIZADORES ESPECIALES) ---
    // Estos serializadores permiten leer JSON aunque vengan como String desde la BD
    @Serializable(with = EsposaSerializer::class)
    val esposa: EsposaData? = null,

    @Serializable(with = HijosSerializer::class)
    val hijos: List<HijoData>? = null,

    // --- DOCUMENTOS URLS ---
    @SerialName("url_dni_frontal") val urlDniFrontal: String? = null,
    @SerialName("url_dni_reverso") val urlDniReverso: String? = null,
    @SerialName("url_antecedentes") val urlAntecedentes: String? = null,
    @SerialName("url_carnet") val urlCarnet: String? = null,
    @SerialName("url_policiales") val urlPoliciales: String? = null,
    @SerialName("url_penales") val urlPenales: String? = null,
    @SerialName("url_acta_matrimonio") val urlActaMatrimonio: String? = null,
    @SerialName("url_esposa_dni") val urlEsposaDni: String? = null,
    @SerialName("url_hijos_nacimiento") val urlHijosNacimiento: String? = null,
    @SerialName("url_hijos_dni") val urlHijosDni: String? = null,
    @SerialName("url_constancia_estudios") val urlConstanciaEstudios: String? = null,

    // --- INDUCCI�N SSOMA ---
    @SerialName("video_progress") val videoProgress: Int = 0,
    @SerialName("examen_nota") val examenNota: Int? = null,
    @SerialName("ssoma_completed") val ssomaCompleted: Boolean = false,

    // --- FIRMA Y ESTADO ---
    @SerialName("url_firma") val urlFirma: String? = null,
    val estado: String = "pendiente",

    // --- DASHBOARD ---
    @SerialName("doc_states") val docStates: JsonObject? = null
)

@Serializable
data class EsposaData(
    val dni: String = "",
    val paterno: String = "",
    val materno: String = "",
    val nombres: String = ""
)

@Serializable
data class HijoData(
    val paterno: String = "",
    val materno: String = "",
    val nombres: String = "",
    @SerialName("fecha_nacimiento") val fechaNacimiento: String = ""
)

// --- SERIALIZADORES M�GICOS ---
// Estos objetos detectan si el dato viene como String (ej: "{...}") o como Objeto
// y lo convierten autom�ticamente para evitar el crash.

object EsposaSerializer : JsonTransformingSerializer<EsposaData>(EsposaData.serializer()) {
    override fun transformDeserialize(element: JsonElement): JsonElement {
        return if (element is JsonPrimitive && element.isString) {
            try {
                Json.parseToJsonElement(element.content)
            } catch (e: Exception) {
                element // Si falla, devuelve el original (probablemente null o vac�o)
            }
        } else {
            element
        }
    }
}

object HijosSerializer : JsonTransformingSerializer<List<HijoData>>(ListSerializer(HijoData.serializer())) {
    override fun transformDeserialize(element: JsonElement): JsonElement {
        return if (element is JsonPrimitive && element.isString) {
            try {
                Json.parseToJsonElement(element.content)
            } catch (e: Exception) {
                element
            }
        } else {
            element
        }
    }
}