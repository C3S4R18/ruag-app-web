package com.ruag.digital.ui.screens

// IMPORTS ANDROID / JAVA

// IMPORTS ANDROIDX / COMPOSE

// IMPORTS TERCEROS

// IMPORTS LOCALES
import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Matrix
import android.graphics.Paint
import android.graphics.pdf.PdfDocument
import android.media.ExifInterface
import android.net.Uri
import android.provider.OpenableColumns
import android.webkit.MimeTypeMap
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.camera.core.CameraSelector
import androidx.camera.core.ImageCapture
import androidx.camera.core.ImageCaptureException
import androidx.camera.core.Preview
import androidx.camera.lifecycle.ProcessCameraProvider
import androidx.camera.view.PreviewView
import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.animateContentSize
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountBalanceWallet
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Badge
import androidx.compose.material.icons.filled.CameraAlt
import androidx.compose.material.icons.filled.Cancel
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.ChevronLeft
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.ChildCare
import androidx.compose.material.icons.filled.Close
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.Draw
import androidx.compose.material.icons.filled.Engineering
import androidx.compose.material.icons.filled.FamilyRestroom
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.FilterBAndW
import androidx.compose.material.icons.filled.FolderOpen
import androidx.compose.material.icons.filled.Groups
import androidx.compose.material.icons.filled.MedicalServices
import androidx.compose.material.icons.filled.Pending
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.RotateRight
import androidx.compose.material.icons.filled.School
import androidx.compose.material.icons.filled.Verified
import androidx.compose.material.icons.filled.Work
import androidx.compose.material.icons.outlined.Description
import androidx.compose.material.icons.outlined.Shield
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.Checkbox
import androidx.compose.material3.CheckboxDefaults
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Divider
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.OutlinedTextFieldDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.BlendMode
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.ColorFilter
import androidx.compose.ui.graphics.ColorMatrix
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.asAndroidPath
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.layout.onGloballyPositioned
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import androidx.core.content.ContextCompat
import androidx.navigation.NavController
import coil.compose.AsyncImage
import com.ruag.digital.data.EsposaData
import com.ruag.digital.data.Ficha
import com.ruag.digital.data.HijoData
import com.ruag.digital.data.SupabaseClient
import io.github.jan.supabase.gotrue.auth
import io.github.jan.supabase.postgrest.from
import io.github.jan.supabase.realtime.PostgresAction
import io.github.jan.supabase.realtime.channel
import io.github.jan.supabase.realtime.decodeRecord
import io.github.jan.supabase.realtime.postgresChangeFlow
import io.github.jan.supabase.storage.storage
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.io.File
import java.io.FileOutputStream
import java.util.UUID

// --- COLORES ---
private val Slate950 = Color(0xFF020617)
private val Emerald400 = Color(0xFF34D399)
private val Slate900 = Color(0xFF0F172A)
private val Slate800 = Color(0xFF1E293B)
private val Slate700 = Color(0xFF334155)
private val Slate500 = Color(0xFF64748B)
private val Slate400 = Color(0xFF94A3B8)
private val Slate300 = Color(0xFFCBD5E1)
private val Slate200 = Color(0xFFE2E8F0)
private val Slate100 = Color(0xFFF1F5F9)
private val Slate50 = Color(0xFFF8FAFC)

private val Blue600 = Color(0xFF2563EB)
private val Blue100 = Color(0xFFDBEAFE)
private val Blue50 = Color(0xFFEFF6FF)

private val Emerald600 = Color(0xFF059669)
private val Emerald500 = Color(0xFF10B981)
private val Emerald100 = Color(0xFFD1FAE5)
private val Emerald50 = Color(0xFFECFDF5)

private val Red500 = Color(0xFFEF4444)
private val Red50 = Color(0xFFFEF2F2)
private val Amber400 = Color(0xFFFBBF24)

private data class DocumentUploadTarget(
    val field: String,
    val format: String,
    val label: String
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun WorkerFormScreen(navController: NavController) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    var currentStep by remember { mutableIntStateOf(1) }
    var isLoading by remember { mutableStateOf(true) }
    var isUploading by remember { mutableStateOf(false) }
    var isCompleted by remember { mutableStateOf(false) }
    var declaracionAceptada by remember { mutableStateOf(false) }

    var ficha by remember { mutableStateOf(Ficha(userId = "")) }
    var userEmail by remember { mutableStateOf("") }

    LaunchedEffect(Unit) {
        val user = SupabaseClient.client.auth.currentUserOrNull()
        if (user != null) {
            val uid = user.id
            userEmail = user.email ?: ""
            try {
                val existingFicha = SupabaseClient.client.from("fichas").select { filter { eq("user_id", uid) } }.decodeSingleOrNull<Ficha>()
                if (existingFicha != null) {
                    ficha = existingFicha
                    isCompleted = (existingFicha.estado == "completado")
                } else {
                    ficha = Ficha(userId = uid, correo = userEmail)
                }
            } catch (e: Exception) {
                Toast.makeText(context, "Error de conexión", Toast.LENGTH_SHORT).show()
            } finally { isLoading = false }
        }
    }

    DisposableEffect(ficha.userId) {
        if (ficha.userId.isEmpty()) return@DisposableEffect onDispose {}
        val channel = SupabaseClient.client.channel("ficha-realtime-${ficha.userId}")
        val flow = channel.postgresChangeFlow<PostgresAction.Update>(schema = "public") {
            table = "fichas"
            filter = "user_id=eq.${ficha.userId}"
        }
        val job = scope.launch {
            channel.subscribe()
            flow.collect { change ->
                try {
                    val updatedFicha = change.decodeRecord<Ficha>()
                    ficha = updatedFicha
                    isCompleted = (updatedFicha.estado == "completado")
                } catch (e: Exception) { }
            }
        }
        onDispose { scope.launch { channel.unsubscribe() }; job.cancel() }
    }

    fun saveProgress(finish: Boolean = false) {
        scope.launch {
            if (finish) isLoading = true
            try {
                if (ficha.userId.isEmpty()) return@launch
                val fichaToSave = if (finish) ficha.copy(estado = "completado") else ficha.copy(estado = "pendiente")
                SupabaseClient.client.from("fichas").upsert(fichaToSave, onConflict = "user_id")
                if (finish) {
                    isCompleted = true
                    Toast.makeText(context, "¡Ficha enviada correctamente!", Toast.LENGTH_LONG).show()
                }
            } catch (e: Exception) {
                Toast.makeText(context, "Error al guardar: ${e.message}", Toast.LENGTH_SHORT).show()
            } finally { isLoading = false }
        }
    }

    if (isLoading && !isCompleted) {
        Box(Modifier.fillMaxSize().background(Slate50), contentAlignment = Alignment.Center) { CircularProgressIndicator(color = Blue600) }
        return
    }

    if (isCompleted) {
        ReadModeScreen(ficha = ficha, navController = navController, onBack = { navController.popBackStack() })
        return
    }

    Scaffold(
        containerColor = Slate50,
        topBar = {
            Column(Modifier.fillMaxWidth().background(Color.White).padding(top = 16.dp, bottom = 12.dp, start = 16.dp, end = 16.dp)) {
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                    Text("PASO $currentStep DE 5", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Slate400, letterSpacing = 1.sp)
                    Text("${(currentStep * 20)}% COMPLETADO", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Slate900)
                }
                Spacer(Modifier.height(8.dp))
                Box(Modifier.fillMaxWidth().height(8.dp).clip(RoundedCornerShape(4.dp)).background(Slate100)) {
                    Box(Modifier.fillMaxHeight().fillMaxWidth(currentStep / 5f).background(Slate900, RoundedCornerShape(4.dp)).animateContentSize())
                }
                Spacer(Modifier.height(16.dp))
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    StepIndicator(1, Icons.Default.Person, currentStep, "Personal")
                    StepIndicator(2, Icons.Default.Groups, currentStep, "Familia")
                    StepIndicator(3, Icons.Default.Engineering, currentStep, "Laboral")
                    StepIndicator(4, Icons.Default.FolderOpen, currentStep, "Docs")
                    StepIndicator(5, Icons.Default.Draw, currentStep, "Firma")
                }
            }
        },
        bottomBar = {
            Surface(shadowElevation = 16.dp, color = Color.White) {
                Row(Modifier.fillMaxWidth().padding(16.dp), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                    if (currentStep > 1) {
                        OutlinedButton(onClick = { currentStep-- }, modifier = Modifier.weight(1f).height(56.dp), shape = RoundedCornerShape(14.dp), border = BorderStroke(1.dp, Slate200), colors = ButtonDefaults.outlinedButtonColors(contentColor = Slate500)) {
                            Icon(Icons.Default.ChevronLeft, null); Spacer(Modifier.width(4.dp)); Text("Atrás", fontWeight = FontWeight.Bold)
                        }
                    } else { Spacer(Modifier.weight(1f)) }

                    Button(
                        onClick = {
                            if (currentStep < 5) {
                                saveProgress(false)
                                currentStep++
                            } else {
                                if (ficha.urlFirma == null) Toast.makeText(context, "Debes guardar tu firma para continuar", Toast.LENGTH_SHORT).show()
                                else if (!declaracionAceptada) Toast.makeText(context, "Acepta la declaración", Toast.LENGTH_SHORT).show()
                                else saveProgress(true)
                            }
                        },
                        modifier = Modifier.weight(1f).height(56.dp),
                        shape = RoundedCornerShape(14.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = if(currentStep == 5) Emerald600 else Blue600, // Azul para Siguiente, Verde para Enviar
                            contentColor = Color.White // Letras blancas
                        )
                    ) {
                        if (isUploading) CircularProgressIndicator(color = Color.White, modifier = Modifier.size(20.dp), strokeWidth = 2.dp)
                        else {
                            Text(if (currentStep == 5) "ENVIAR FICHA" else "Siguiente", fontWeight = FontWeight.Bold)
                            if (currentStep < 5) { Spacer(Modifier.width(4.dp)); Icon(Icons.Default.ChevronRight, null) }
                        }
                    }
                }
            }
        }
    ) { padding ->
        Column(Modifier.padding(padding).fillMaxSize().verticalScroll(rememberScrollState()).padding(20.dp)) {
            AnimatedContent(targetState = currentStep, label = "Steps") { step ->
                Column(verticalArrangement = Arrangement.spacedBy(24.dp)) {
                    when (step) {
                        1 -> StepPersonal(ficha) { ficha = it }
                        2 -> StepFamilia(ficha) { ficha = it }
                        3 -> StepLaboral(ficha) { ficha = it }
                        4 -> StepDocumentos(context, ficha, { ficha = it }, { isUploading = it })
                        5 -> StepFirma(context, ficha, { ficha = it }, declaracionAceptada, { declaracionAceptada = it })
                    }
                }
            }
            Spacer(Modifier.height(80.dp))
        }
    }
}

// ==========================================
// MODO LECTURA
// ==========================================
@Composable
fun ReadModeScreen(ficha: Ficha, navController: NavController, onBack: () -> Unit) {
    Scaffold(
        containerColor = Slate50,
        bottomBar = {
            Surface(shadowElevation = 16.dp, color = Color.White) {
                Box(Modifier.padding(16.dp).fillMaxWidth()) {
                    Button(
                        onClick = onBack, modifier = Modifier.fillMaxWidth().height(56.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = Slate900, contentColor = Color.White), shape = RoundedCornerShape(12.dp)
                    ) { Text("VOLVER AL INICIO", fontWeight = FontWeight.Bold, fontSize = 16.sp) }
                }
            }
        }
    ) { padding ->
        Column(Modifier.padding(padding).fillMaxSize().verticalScroll(rememberScrollState())) {
            Box(Modifier.fillMaxWidth().background(Slate900).padding(top = 40.dp, bottom = 50.dp, start = 24.dp, end = 24.dp)) {
                Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.fillMaxWidth()) {
                    Box(Modifier.size(90.dp).background(Color.White.copy(0.1f), CircleShape).border(2.dp, Emerald500, CircleShape).padding(20.dp)) {
                        Icon(Icons.Default.Verified, null, tint = Emerald500, modifier = Modifier.fillMaxSize())
                    }
                    Spacer(Modifier.height(16.dp))
                    Text(text = "${ficha.nombres?.split(" ")?.firstOrNull() ?: ""} ${ficha.apellidoPaterno ?: ""}", color = Color.White, fontSize = 22.sp, fontWeight = FontWeight.Bold, textAlign = TextAlign.Center)
                    Text(text = ficha.cargo?.uppercase() ?: "TRABAJADOR", color = Slate300, fontSize = 14.sp, fontWeight = FontWeight.Medium, letterSpacing = 1.sp)
                    Spacer(Modifier.height(20.dp))
                    Row(modifier = Modifier.background(Emerald600, RoundedCornerShape(50)).padding(horizontal = 16.dp, vertical = 6.dp), verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.CheckCircle, null, tint = Color.White, modifier = Modifier.size(16.dp))
                        Spacer(Modifier.width(6.dp))
                        Text("FICHA VALIDADA", color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                    }
                }
            }

            Column(Modifier.offset(y = (-30).dp).padding(horizontal = 20.dp).fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(16.dp)) {
                // 1. DATOS PERSONALES
                ReadOnlyCard("Datos Personales", Icons.Default.Person) {
                    ReadOnlyField("Nombre Completo", "${ficha.nombres ?: ""} ${ficha.apellidoPaterno ?: ""} ${ficha.apellidoMaterno ?: ""}", true)
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                        Box(Modifier.weight(1f)) { ReadOnlyField("DNI", ficha.dni) }
                        Box(Modifier.weight(1f)) { ReadOnlyField("Celular", ficha.celular) }
                    }
                    ReadOnlyField("Dirección", ficha.direccion, true)
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                        Box(Modifier.weight(1f)) { ReadOnlyField("Distrito", ficha.distrito) }
                        Box(Modifier.weight(1f)) { ReadOnlyField("F. Nacimiento", ficha.fechaNacimiento) }
                    }
                }

                // 2. FAMILIA
                ReadOnlyCard("Familia y Contacto", Icons.Default.Groups) {
                    ReadOnlyField("Esposa/o / Cónyuge", ficha.esposa?.nombres?.ifBlank { null } ?: "No registrado", true)
                    Text("Hijos Registrados", fontSize = 11.sp, color = Slate400, fontWeight = FontWeight.Bold, modifier = Modifier.padding(top=8.dp, bottom=4.dp))
                    if (ficha.hijos.isNullOrEmpty()) {
                        Text("Sin hijos registrados", fontSize = 13.sp, color = Slate500, fontStyle = androidx.compose.ui.text.font.FontStyle.Italic)
                    } else {
                        ficha.hijos!!.forEach {
                            Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(bottom=4.dp)) {
                                Icon(Icons.Default.ChildCare, null, tint = Slate400, modifier = Modifier.size(16.dp))
                                Spacer(Modifier.width(8.dp))
                                Text("${it.nombres} ${it.paterno} ${it.materno} (Nac: ${it.fechaNacimiento.ifEmpty { "No registrada" }})", fontSize = 13.sp, color = Slate800, fontWeight = FontWeight.Medium)
                            }
                        }
                    }
                    Divider(Modifier.padding(vertical = 12.dp), color = Slate100)
                    ReadOnlyField("Contacto Emergencia", ficha.emergenciaNombre ?: "-", true)
                    ReadOnlyField("Teléfono Emergencia", ficha.emergenciaCelular ?: "-")
                }

                // 4. LABORAL
                ReadOnlyCard("Información Laboral", Icons.Default.Engineering) {
                    ReadOnlyField("Cargo", ficha.cargo, true)
                    ReadOnlyField("Obra / Proyecto", ficha.nombreObra, true)
                    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                        Box(Modifier.weight(1f)) { ReadOnlyField("Fecha Ingreso", ficha.fechaIngreso) }
                        Box(Modifier.weight(1f)) { ReadOnlyField("Régimen", ficha.sistemaPension) }
                    }
                }

                // 5. DOCUMENTOS
                ReadOnlyCard("Documentación", Icons.Default.FolderOpen) {
                    // Documentos Principales
                    DocCheckItem("DNI Completo (PDF)", ficha.urlDniFrontal) // Usamos el Frontal porque ahí se guardó el PDF unido
                    DocCheckItem("Antecedentes", ficha.urlAntecedentes)
                    DocCheckItem("Carnet RETCC", ficha.urlCarnet)
                    DocCheckItem("Ant. Policiales", ficha.urlPoliciales)
                    DocCheckItem("Ant. Penales", ficha.urlPenales)

                    // Documentos Familiares (Condicionales: solo se muestran si existen, igual que en Next.js)
                    if (!ficha.urlActaMatrimonio.isNullOrBlank()) {
                        DocCheckItem("Acta Matrimonio", ficha.urlActaMatrimonio)
                    }
                    if (!ficha.urlEsposaDni.isNullOrBlank()) {
                        DocCheckItem("DNI Esposo/a", ficha.urlEsposaDni)
                    }
                    if (!ficha.urlHijosNacimiento.isNullOrBlank()) {
                        DocCheckItem("Partida Nacimiento Hijos", ficha.urlHijosNacimiento)
                    }
                    if (!ficha.urlHijosDni.isNullOrBlank()) {
                        DocCheckItem("DNI Hijos/Hijas", ficha.urlHijosDni)
                    }
                    if (!ficha.urlConstanciaEstudios.isNullOrBlank()) {
                        DocCheckItem("Estudios Hijos", ficha.urlConstanciaEstudios)
                    }
                }

                // 6. FIRMA DIGITAL
                Card(colors = CardDefaults.cardColors(containerColor = Color.White), shape = RoundedCornerShape(20.dp), elevation = CardDefaults.cardElevation(4.dp)) {
                    Column(Modifier.padding(24.dp).fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("Firma del Trabajador", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = Slate900)
                        Spacer(Modifier.height(16.dp))
                        if (ficha.urlFirma != null) {
                            Box(Modifier.fillMaxWidth().height(120.dp).background(Slate50, RoundedCornerShape(12.dp)).border(1.dp, Slate200, RoundedCornerShape(12.dp)).padding(8.dp), contentAlignment = Alignment.Center) {
                                AsyncImage(model = ficha.urlFirma, contentDescription = "Firma", modifier = Modifier.fillMaxSize(), contentScale = ContentScale.Fit)
                            }
                        } else {
                            Box(Modifier.fillMaxWidth().height(100.dp).background(Red50, RoundedCornerShape(12.dp)).border(1.dp, Red500.copy(0.3f), RoundedCornerShape(12.dp)), contentAlignment = Alignment.Center) {
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    Icon(Icons.Default.Draw, null, tint = Red500.copy(0.5f), modifier = Modifier.size(32.dp))
                                    Text("Firma no registrada", color = Red500, fontSize = 12.sp, fontWeight = FontWeight.Medium)
                                }
                            }
                        }
                    }
                }
                Spacer(Modifier.height(40.dp))
            }
        }
    }
}

// ==========================================
// STEPS
// ==========================================

@Composable
fun StepPersonal(ficha: Ficha, update: (Ficha) -> Unit) {
    SectionTitle("Información Personal", Icons.Default.Badge)
    CardInputContainer {
        AppInput("Apellido Paterno", ficha.apellidoPaterno ?: "", true) { update(ficha.copy(apellidoPaterno = it)) }
        AppInput("Apellido Materno", ficha.apellidoMaterno ?: "", true) { update(ficha.copy(apellidoMaterno = it)) }
        AppInput("Nombres", ficha.nombres ?: "", true) { update(ficha.copy(nombres = it)) }
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            Box(Modifier.weight(1f)) { AppInput("DNI", ficha.dni ?: "", true, KeyboardOptions(keyboardType = KeyboardType.Number)) { update(ficha.copy(dni = it)) } }
            Box(Modifier.weight(1f)) { AppInput("F. Nacimiento", ficha.fechaNacimiento ?: "", false) { update(ficha.copy(fechaNacimiento = it)) } }
        }
        AppInput("Celular", ficha.celular ?: "", false, KeyboardOptions(keyboardType = KeyboardType.Phone)) { update(ficha.copy(celular = it)) }
        AppInput("Correo Electrónico", ficha.correo ?: "") { update(ficha.copy(correo = it)) }
        AppInput("Dirección", ficha.direccion ?: "") { update(ficha.copy(direccion = it)) }
        AppInput("Distrito", ficha.distrito ?: "") { update(ficha.copy(distrito = it)) }
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            Box(Modifier.weight(1f)) { AppInput("Provincia", ficha.provincia ?: "") { update(ficha.copy(provincia = it)) } }
            Box(Modifier.weight(1f)) { AppInput("Departamento", ficha.departamento ?: "") { update(ficha.copy(departamento = it)) } }
        }
    }
    SectionTitle("Datos Bancarios", Icons.Default.AccountBalanceWallet)
    CardInputContainer {
        AppInput("Banco", ficha.banco ?: "") { update(ficha.copy(banco = it)) }
        AppInput("N° Cuenta", ficha.numeroCuenta ?: "") { update(ficha.copy(numeroCuenta = it)) }
        AppInput("CCI (20 dígitos)", ficha.cci ?: "") { update(ficha.copy(cci = it)) }
        Text("Sistema de Pensiones", fontSize = 11.sp, color = Slate400, fontWeight = FontWeight.Bold, modifier = Modifier.padding(top = 8.dp, bottom = 4.dp))
        Row(Modifier.fillMaxWidth().background(Slate50, RoundedCornerShape(12.dp)).padding(4.dp)) {
            PensionOption("ONP", ficha.sistemaPension == "ONP") { update(ficha.copy(sistemaPension = "ONP", afpNombre = "")) }
            PensionOption("AFP", ficha.sistemaPension == "AFP") { update(ficha.copy(sistemaPension = "AFP")) }
        }
        if (ficha.sistemaPension == "AFP") {
            Spacer(Modifier.height(12.dp))
            AppInput("Nombre AFP (Ej. Integra)", ficha.afpNombre ?: "") { update(ficha.copy(afpNombre = it)) }
            AppInput("CUSPP", ficha.cuspp ?: "") { update(ficha.copy(cuspp = it)) }
        }
    }
}

@Composable
fun StepFamilia(ficha: Ficha, update: (Ficha) -> Unit) {
    val esposa = ficha.esposa ?: EsposaData()
    SectionTitle("Esposa / Conviviente", Icons.Default.Favorite)
    CardInputContainer {
        AppInput("DNI Esposa", esposa.dni) { update(ficha.copy(esposa = esposa.copy(dni = it))) }
        AppInput("Nombres", esposa.nombres) { update(ficha.copy(esposa = esposa.copy(nombres = it))) }
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            Box(Modifier.weight(1f)) { AppInput("A. Paterno", esposa.paterno) { update(ficha.copy(esposa = esposa.copy(paterno = it))) } }
            Box(Modifier.weight(1f)) { AppInput("A. Materno", esposa.materno) { update(ficha.copy(esposa = esposa.copy(materno = it))) } }
        }
    }

    Row(Modifier.fillMaxWidth().padding(top = 24.dp), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
        SectionTitle("Hijos Registrados", Icons.Default.ChildCare, false)
        SmallButton("AGREGAR", Icons.Default.Add) {
            val list = (ficha.hijos ?: emptyList()).toMutableList()
            list.add(HijoData())
            update(ficha.copy(hijos = list))
        }
    }

    if (ficha.hijos.isNullOrEmpty()) Text("No hay hijos registrados", color = Slate400, fontSize = 14.sp, fontStyle = androidx.compose.ui.text.font.FontStyle.Italic, modifier = Modifier.fillMaxWidth().padding(vertical = 20.dp), textAlign = TextAlign.Center)

    ficha.hijos?.forEachIndexed { idx, hijo ->
        Card(modifier = Modifier.padding(bottom = 12.dp), colors = CardDefaults.cardColors(containerColor = Color.White), border = BorderStroke(1.dp, Slate200)) {
            Column(Modifier.padding(16.dp)) {
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("Hijo #${idx+1}", fontWeight = FontWeight.Bold, color = Slate800)
                    Icon(Icons.Default.Delete, null, tint = Red500, modifier = Modifier.clickable {
                        val list = ficha.hijos!!.toMutableList()
                        list.removeAt(idx)
                        update(ficha.copy(hijos = list))
                    })
                }
                Spacer(Modifier.height(12.dp))
                AppInput("Nombres", hijo.nombres) {
                    val list = ficha.hijos!!.toMutableList(); list[idx] = list[idx].copy(nombres = it); update(ficha.copy(hijos = list))
                }
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    Box(Modifier.weight(1f)) { AppInput("A. Paterno", hijo.paterno) { val list = ficha.hijos!!.toMutableList(); list[idx] = list[idx].copy(paterno = it); update(ficha.copy(hijos = list)) } }
                    Box(Modifier.weight(1f)) { AppInput("A. Materno", hijo.materno) { val list = ficha.hijos!!.toMutableList(); list[idx] = list[idx].copy(materno = it); update(ficha.copy(hijos = list)) } }
                }
                AppInput("Fecha Nacimiento", hijo.fechaNacimiento) {
                    val list = ficha.hijos!!.toMutableList(); list[idx] = list[idx].copy(fechaNacimiento = it); update(ficha.copy(hijos = list))
                }
            }
        }
    }
}

@Composable
fun StepLaboral(ficha: Ficha, update: (Ficha) -> Unit) {
    SectionTitle("Información Laboral", Icons.Default.Work)
    CardInputContainer {
        AppInput("Cargo", ficha.cargo ?: "") { update(ficha.copy(cargo = it)) }
        AppInput("Obra / Proyecto", ficha.nombreObra ?: "") { update(ficha.copy(nombreObra = it)) }
        AppInput("Categoría", ficha.categoria ?: "") { update(ficha.copy(categoria = it)) }
        AppInput("Fecha Ingreso", ficha.fechaIngreso ?: "") { update(ficha.copy(fechaIngreso = it)) }
    }
    SectionTitle("Formación Académica", Icons.Default.School)
    CardInputContainer {
        AppInput("Nivel Educativo", ficha.nivelEducacion ?: "") { update(ficha.copy(nivelEducacion = it)) }
        AppInput("Carrera / Oficio", ficha.carrera ?: "") { update(ficha.copy(carrera = it)) }
        AppInput("Institución Educativa", ficha.universidad ?: "") { update(ficha.copy(universidad = it)) }
    }
    SectionTitle("Contacto Emergencia", Icons.Default.MedicalServices)
    CardInputContainer {
        AppInput("Nombre Contacto", ficha.emergenciaNombre ?: "") { update(ficha.copy(emergenciaNombre = it)) }
        AppInput("Parentesco", ficha.emergenciaRelacion ?: "") { update(ficha.copy(emergenciaRelacion = it)) }
        AppInput("Teléfono", ficha.emergenciaCelular ?: "", false, KeyboardOptions(keyboardType = KeyboardType.Phone)) { update(ficha.copy(emergenciaCelular = it)) }
    }
}

@Composable
fun StepDocumentos(context: Context, ficha: Ficha, update: (Ficha) -> Unit, setUploading: (Boolean) -> Unit) {
    val scope = rememberCoroutineScope()
    var showCamera by remember { mutableStateOf(false) }
    var showSourceDialog by remember { mutableStateOf(false) }
    var selectedTarget by remember { mutableStateOf<DocumentUploadTarget?>(null) }

    val permissionLauncher = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) {
        if (it) {
            showCamera = true
        }
    }

    fun updateDocumentUrl(targetField: String, url: String) {
        when (targetField) {
            "dni_f" -> update(ficha.copy(urlDniFrontal = url))
            "dni_r" -> update(ficha.copy(urlDniReverso = url))
            "cert" -> update(ficha.copy(urlAntecedentes = url))
            "carnet" -> update(ficha.copy(urlCarnet = url))
            "pol" -> update(ficha.copy(urlPoliciales = url))
            "pen" -> update(ficha.copy(urlPenales = url))
            "mat" -> update(ficha.copy(urlActaMatrimonio = url))
            "esp_dni" -> update(ficha.copy(urlEsposaDni = url))
            "hij_dni" -> update(ficha.copy(urlHijosDni = url))
            "hij_est" -> update(ficha.copy(urlConstanciaEstudios = url))
        }
    }

    fun uploadDocumentBytes(bytes: ByteArray, extension: String) {
        val activeTarget = selectedTarget ?: return
        setUploading(true)
        scope.launch(Dispatchers.IO) {
            try {
                val safeExtension = extension.ifBlank { "pdf" }
                val fileName = "${UUID.randomUUID()}.$safeExtension"
                val bucket = SupabaseClient.client.storage.from("documentos")
                bucket.upload(fileName, bytes, upsert = true)
                val url = bucket.publicUrl(fileName)
                withContext(Dispatchers.Main) {
                    updateDocumentUrl(activeTarget.field, url)
                    setUploading(false)
                    selectedTarget = null
                    Toast.makeText(context, "Documento subido con exito", Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    setUploading(false)
                    Toast.makeText(context, "Error al subir documento", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }

    val filePickerLauncher = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        if (uri == null) {
            selectedTarget = null
            return@rememberLauncherForActivityResult
        }

        val extension = resolveDocumentExtension(context, uri)
        scope.launch(Dispatchers.IO) {
            try {
                val bytes = context.contentResolver.openInputStream(uri)?.use { it.readBytes() }
                    ?: throw IllegalStateException("No se pudo leer el archivo seleccionado")
                withContext(Dispatchers.Main) {
                    uploadDocumentBytes(bytes, extension)
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    selectedTarget = null
                    setUploading(false)
                    Toast.makeText(context, "No se pudo leer el archivo", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }

    fun openDocumentOptions(field: String, format: String, label: String) {
        selectedTarget = DocumentUploadTarget(field = field, format = format, label = label)
        showSourceDialog = true
    }

    fun launchScan() {
        if (selectedTarget == null) return
        showSourceDialog = false
        if (ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED) {
            showCamera = true
        } else {
            permissionLauncher.launch(Manifest.permission.CAMERA)
        }
    }

    fun launchFilePicker() {
        if (selectedTarget == null) return
        showSourceDialog = false
        filePickerLauncher.launch("*/*")
    }

    if (showSourceDialog && selectedTarget != null) {
        DocumentSourceDialog(
            label = selectedTarget!!.label,
            onDismiss = {
                showSourceDialog = false
                selectedTarget = null
            },
            onTakePhoto = { launchScan() },
            onPickFile = { launchFilePicker() }
        )
    }

    if (showCamera && selectedTarget != null) {
        SmartScannerDialog(
            format = selectedTarget!!.format,
            onClose = {
                showCamera = false
                selectedTarget = null
            },
            onCapture = { file ->
                showCamera = false
                uploadDocumentBytes(file.readBytes(), "pdf")
            }
        )
    }

    SectionTitle("Documentos del Trabajador", Icons.Default.FolderOpen)
    Text(
        "Toca un documento para elegir si deseas tomar foto o subir un archivo. El DNI requiere ambas caras en un solo PDF.",
        fontSize = 12.sp,
        color = Slate500,
        modifier = Modifier.padding(bottom = 16.dp)
    )

    DocGrid {
        DocItem("DNI Completo (Frontal y Reverso)", ficha.urlDniFrontal) {
            openDocumentOptions("dni_f", "id", "DNI Completo")
        }
        DocItem("Certiadulto", ficha.urlAntecedentes) {
            openDocumentOptions("cert", "a4", "Certiadulto")
        }
        DocItem("Carnet RETCC", ficha.urlCarnet) {
            openDocumentOptions("carnet", "id", "Carnet RETCC")
        }
        DocItem("Ant. Policiales", ficha.urlPoliciales) {
            openDocumentOptions("pol", "a4", "Antecedentes Policiales")
        }
        DocItem("Ant. Penales", ficha.urlPenales) {
            openDocumentOptions("pen", "a4", "Antecedentes Penales")
        }
    }
    SectionTitle("Documentos Familiares", Icons.Default.FamilyRestroom)
    DocGrid {
        DocItem("Acta Matrimonio", ficha.urlActaMatrimonio) {
            openDocumentOptions("mat", "a4", "Acta Matrimonio")
        }
        DocItem("DNI Esposa", ficha.urlEsposaDni) {
            openDocumentOptions("esp_dni", "id", "DNI Esposa")
        }
        DocItem("DNI Hijos", ficha.urlHijosDni) {
            openDocumentOptions("hij_dni", "id", "DNI Hijos")
        }
        DocItem("Estudios Hijos", ficha.urlConstanciaEstudios) {
            openDocumentOptions("hij_est", "a4", "Estudios Hijos")
        }
    }
}

@Composable
fun StepFirma(context: Context, ficha: Ficha, update: (Ficha) -> Unit, accepted: Boolean, setAccepted: (Boolean) -> Unit) {
    SectionTitle("Firma de Conformidad", Icons.Default.Draw)
    Text("Dibuja tu firma en el recuadro y presiona 'Guardar Firma'.", color = Slate500, fontSize = 14.sp, modifier = Modifier.padding(bottom = 16.dp))

    val paths = remember { mutableStateListOf<Path>() }
    var currentPath by remember { mutableStateOf<Path?>(null) }
    var isSavingSignature by remember { mutableStateOf(false) }

    // --- ESTE ES EL TRUCO PARA EL TIEMPO REAL ---
    var drawTrigger by remember { mutableIntStateOf(0) }

    // --- NUEVO: GUARDAR EL TAMAÑO REAL DEL CANVAS ---
    var canvasWidth by remember { mutableIntStateOf(800) }
    var canvasHeight by remember { mutableIntStateOf(400) }

    val scope = rememberCoroutineScope()

    if (ficha.urlFirma != null) {
        Box(Modifier.fillMaxWidth().height(200.dp).background(Color.White, RoundedCornerShape(16.dp)).border(1.dp, Slate200, RoundedCornerShape(16.dp)), contentAlignment = Alignment.Center) {
            AsyncImage(model = ficha.urlFirma, contentDescription = null, modifier = Modifier.fillMaxSize().padding(16.dp), contentScale = ContentScale.Fit)
            IconButton(onClick = { update(ficha.copy(urlFirma = null)); paths.clear() }, modifier = Modifier.align(Alignment.TopEnd)) { Icon(Icons.Default.Close, null, tint = Red500) }
        }
    } else {
        Column {
            Card(modifier = Modifier.fillMaxWidth().height(240.dp), shape = RoundedCornerShape(16.dp), border = BorderStroke(2.dp, Slate200), colors = CardDefaults.cardColors(containerColor = Color.White)) {
                Box(Modifier.fillMaxSize()) {
                    if (paths.isEmpty() && currentPath == null) Text("Firma aquí", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = Slate300, modifier = Modifier.align(Alignment.Center))

                    Canvas(modifier = Modifier
                        .fillMaxSize()
                        .onGloballyPositioned {
                            // AQUÍ CAPTURAMOS EL TAMAÑO EXACTO DEL LIENZO
                            canvasWidth = it.size.width
                            canvasHeight = it.size.height
                        }
                        .pointerInput(Unit) {
                            detectDragGestures(
                                onDragStart = {
                                    currentPath = Path().apply { moveTo(it.x, it.y) }
                                    drawTrigger++ // Avisa que empezamos a dibujar
                                },
                                onDrag = { change, _ ->
                                    currentPath?.lineTo(change.position.x, change.position.y)
                                    drawTrigger++ // Avisa en TIEMPO REAL que el dedo se mueve
                                },
                                onDragEnd = {
                                    currentPath?.let { paths.add(it) }
                                    currentPath = null
                                }
                            )
                        }) {
                        drawTrigger // Leemos la variable para forzar el redibujado

                        paths.forEach { drawPath(it, Color.Black, style = Stroke(8f, cap = StrokeCap.Round, join = StrokeJoin.Round)) }
                        currentPath?.let { drawPath(it, Color.Black, style = Stroke(8f, cap = StrokeCap.Round, join = StrokeJoin.Round)) }
                    }
                    IconButton(onClick = { paths.clear(); currentPath = null; drawTrigger++ }, modifier = Modifier.align(Alignment.TopEnd).padding(8.dp)) { Icon(Icons.Default.Refresh, null, tint = Slate500) }
                }
            }
            Spacer(Modifier.height(12.dp))

            // BOTÓN EXPLÍCITO PARA GUARDAR LA FIRMA
            Button(
                onClick = {
                    if (paths.isEmpty()) { Toast.makeText(context, "La firma está vacía", Toast.LENGTH_SHORT).show(); return@Button }
                    isSavingSignature = true
                    scope.launch(Dispatchers.IO) {
                        // CREAMOS EL BITMAP CON EL TAMAÑO EXACTO DEL CANVAS
                        val w = if (canvasWidth > 0) canvasWidth else 800
                        val h = if (canvasHeight > 0) canvasHeight else 400
                        val bitmap = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888)

                        val canvas = android.graphics.Canvas(bitmap)
                        canvas.drawColor(android.graphics.Color.WHITE) // Fondo blanco
                        val paint = Paint().apply { color = android.graphics.Color.BLACK; style = Paint.Style.STROKE; strokeWidth = 8f; strokeCap = Paint.Cap.ROUND; strokeJoin = Paint.Join.ROUND }
                        paths.forEach { path -> canvas.drawPath(path.asAndroidPath(), paint) }

                        val file = File(context.cacheDir, "sign.png")
                        FileOutputStream(file).use { out -> bitmap.compress(Bitmap.CompressFormat.PNG, 100, out) }
                        try {
                            val bucket = SupabaseClient.client.storage.from("documentos")
                            val fileName = "sign_${UUID.randomUUID()}.png"
                            bucket.upload(fileName, file.readBytes(), upsert = true)
                            withContext(Dispatchers.Main) {
                                update(ficha.copy(urlFirma = bucket.publicUrl(fileName)))
                                isSavingSignature = false
                                Toast.makeText(context, "Firma guardada correctamente", Toast.LENGTH_SHORT).show()
                            }
                        } catch (e: Exception) { withContext(Dispatchers.Main){ isSavingSignature = false; Toast.makeText(context, "Error guardando firma", Toast.LENGTH_SHORT).show() } }
                    }
                },
                modifier = Modifier.fillMaxWidth().height(48.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = Blue600,
                    contentColor = Color.White
                ),
                shape = RoundedCornerShape(12.dp),
                enabled = !isSavingSignature
            ) {
                if(isSavingSignature) CircularProgressIndicator(color=Color.White, modifier=Modifier.size(20.dp))
                else Text("GUARDAR FIRMA", fontWeight = FontWeight.Bold)
            }
        }
    }

    Spacer(Modifier.height(24.dp))
    Row(modifier = Modifier.fillMaxWidth().background(if(accepted) Slate900 else Color.White, RoundedCornerShape(12.dp)).border(1.dp, if(accepted) Slate900 else Slate200, RoundedCornerShape(12.dp)).clickable { setAccepted(!accepted) }.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
        Checkbox(checked = accepted, onCheckedChange = { setAccepted(it) }, colors = CheckboxDefaults.colors(checkedColor = Emerald500, uncheckedColor = Slate300, checkmarkColor = Color.White))
        Column(Modifier.padding(start = 12.dp)) {
            Text("Declaración Jurada", color = if(accepted) Color.White else Slate900, fontWeight = FontWeight.Bold, fontSize = 14.sp)
            Text("Declaro bajo juramento que la información es verdadera.", color = if(accepted) Slate300 else Slate500, fontSize = 12.sp)
        }
    }
}

// --- SCANNER DIALOG (CLON EXACTO DE CAMSCANNER - RECORTE PERFECTO) ---
@Composable
fun SmartScannerDialog(format: String, onClose: () -> Unit, onCapture: (File) -> Unit) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val cameraProviderFuture = remember { ProcessCameraProvider.getInstance(context) }
    var imageCapture by remember { mutableStateOf<ImageCapture?>(null) }

    // Variables para guardar el tamaño EXACTO de la pantalla del celular
    var previewWidth by remember { mutableFloatStateOf(1f) }
    var previewHeight by remember { mutableFloatStateOf(1f) }

    // Estados: "camera" | "edit"
    var step by remember { mutableStateOf("camera") }
    var tempBitmap by remember { mutableStateOf<Bitmap?>(null) }
    var frontBitmap by remember { mutableStateOf<Bitmap?>(null) }

    var rotation by remember { mutableFloatStateOf(0f) }
    var isBw by remember { mutableStateOf(false) }
    var isProcessing by remember { mutableStateOf(false) }

    val isLandscape = format == "id"
    // 1.58 es la proporción de un DNI real, 0.70 es A4
    val aspectRatio = if (isLandscape) 1.58f else 0.70f

    Dialog(onDismissRequest = onClose, properties = DialogProperties(usePlatformDefaultWidth = false)) {
        Box(Modifier.fillMaxSize().background(Color.Black)) {

            if (step == "camera") {
                AndroidView(modifier = Modifier.fillMaxSize(), factory = { ctx ->
                    val previewView = PreviewView(ctx)
                    previewView.scaleType = PreviewView.ScaleType.FILL_CENTER
                    val executor = ContextCompat.getMainExecutor(ctx)
                    cameraProviderFuture.addListener({
                        val provider = cameraProviderFuture.get()
                        val preview = Preview.Builder().build().also { it.setSurfaceProvider(previewView.surfaceProvider) }
                        imageCapture = ImageCapture.Builder().build()
                        try { provider.unbindAll(); provider.bindToLifecycle(lifecycleOwner, CameraSelector.DEFAULT_BACK_CAMERA, preview, imageCapture) } catch (e: Exception) {}
                    }, executor)
                    previewView
                })

                // Overlay de recorte
                Canvas(modifier = Modifier
                    .fillMaxSize()
                    .onGloballyPositioned {
                        // Capturamos el tamaño real del lienzo para precisión milimétrica
                        previewWidth = it.size.width.toFloat()
                        previewHeight = it.size.height.toFloat()
                    }
                ) {
                    val cw = size.width
                    val ch = size.height
                    val frameW = if(isLandscape) cw * 0.9f else cw * 0.85f
                    val frameH = frameW / aspectRatio
                    val left = (cw - frameW) / 2
                    val top = (ch - frameH) / 2

                    drawRect(Color.Black.copy(alpha = 0.8f))
                    drawRect(Color.Transparent, topLeft = Offset(left, top), size = Size(frameW, frameH), blendMode = BlendMode.Clear)
                    drawRect(if(frontBitmap != null) Amber400 else Emerald400, topLeft = Offset(left, top), size = Size(frameW, frameH), style = Stroke(6f))
                }

                // Header
                Row(Modifier.fillMaxWidth().padding(16.dp), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.Top) {
                    IconButton(onClick = onClose, modifier = Modifier.background(Color.White.copy(0.2f), CircleShape)) { Icon(Icons.Default.Close, null, tint = Color.White) }
                    Box(Modifier.background(Color.Black.copy(0.6f), RoundedCornerShape(50)).padding(horizontal=16.dp, vertical=8.dp)) {
                        Text(if(isLandscape) (if(frontBitmap != null) "DNI: REVERSO" else "DNI: FRONTAL") else "DOCUMENTO A4", color=Color.White, fontWeight=FontWeight.Bold, fontSize=12.sp)
                    }
                    Spacer(Modifier.size(40.dp))
                }

                // Bottom Bar
                Box(Modifier.align(Alignment.BottomCenter).fillMaxWidth().padding(bottom = 40.dp), contentAlignment = Alignment.Center) {
                    Button(onClick = {
                        val imgCap = imageCapture ?: return@Button
                        val file = File(context.cacheDir, "temp.jpg")
                        val output = ImageCapture.OutputFileOptions.Builder(file).build()
                        imgCap.takePicture(output, ContextCompat.getMainExecutor(context), object : ImageCapture.OnImageSavedCallback {
                            override fun onImageSaved(res: ImageCapture.OutputFileResults) {
                                val bitmap = BitmapFactory.decodeFile(file.absolutePath)

                                // 1. LEER EXIF ORIGINAL: Forzamos a que la imagen se enderece
                                val exif = ExifInterface(file.absolutePath)
                                val orientation = exif.getAttributeInt(ExifInterface.TAG_ORIENTATION, ExifInterface.ORIENTATION_NORMAL)
                                val matrix = Matrix()
                                when (orientation) {
                                    ExifInterface.ORIENTATION_ROTATE_90 -> matrix.postRotate(90f)
                                    ExifInterface.ORIENTATION_ROTATE_180 -> matrix.postRotate(180f)
                                    ExifInterface.ORIENTATION_ROTATE_270 -> matrix.postRotate(270f)
                                }

                                var baseBitmap = Bitmap.createBitmap(bitmap, 0, 0, bitmap.width, bitmap.height, matrix, true)

                                // 2. SEGURO ANTI-GIRADO: Si la pantalla es vertical, la foto DEBE ser vertical
                                if (previewHeight > previewWidth && baseBitmap.width > baseBitmap.height) {
                                    val fixMatrix = Matrix().apply { postRotate(90f) }
                                    baseBitmap = Bitmap.createBitmap(baseBitmap, 0, 0, baseBitmap.width, baseBitmap.height, fixMatrix, true)
                                }

                                // 3. MATEMÁTICA EXACTA PARA EL RECORTE
                                val bw = baseBitmap.width.toFloat()
                                val bh = baseBitmap.height.toFloat()

                                // Encontramos la escala real entre la foto gigante de la cámara y tu pantalla
                                val scale = maxOf(previewWidth / bw, previewHeight / bh)

                                val boxScreenW = if (isLandscape) previewWidth * 0.9f else previewWidth * 0.85f
                                val boxScreenH = boxScreenW / aspectRatio

                                val cropW = boxScreenW / scale
                                val cropH = boxScreenH / scale
                                val cropX = (bw - cropW) / 2f
                                val cropY = (bh - cropH) / 2f

                                val finalX = cropX.toInt().coerceAtLeast(0)
                                val finalY = cropY.toInt().coerceAtLeast(0)
                                val finalW = cropW.toInt().coerceAtMost(baseBitmap.width - finalX)
                                val finalH = cropH.toInt().coerceAtMost(baseBitmap.height - finalY)

                                // ¡Recorte quirúrgico final!
                                tempBitmap = Bitmap.createBitmap(baseBitmap, finalX, finalY, finalW, finalH)

                                rotation = 0f
                                isBw = false
                                step = "edit"
                            }
                            override fun onError(ex: ImageCaptureException) {}
                        })
                    }, modifier = Modifier.size(80.dp), shape = CircleShape, colors = ButtonDefaults.buttonColors(containerColor = Color.White), border = BorderStroke(4.dp, if(frontBitmap!=null) Amber400 else Emerald500)) {
                        Box(Modifier.size(64.dp).background(Color.Black, CircleShape))
                    }
                }
            }

            if (step == "edit" && tempBitmap != null) {
                Column(Modifier.fillMaxSize()) {
                    // Header Informativo
                    Box(Modifier.fillMaxWidth().background(Slate950).padding(top = 20.dp, bottom = 12.dp), contentAlignment = Alignment.Center) {
                        Text(if(isLandscape) "EDICIÓN DE DNI" else "EDICIÓN DOCUMENTO A4", color = Emerald400, fontWeight = FontWeight.Bold, letterSpacing = 1.sp)
                    }

                    // Vista Previa de Edición
                    Box(Modifier.weight(1f).fillMaxWidth().background(Slate900), contentAlignment = Alignment.Center) {
                        Image(
                            bitmap = tempBitmap!!.asImageBitmap(),
                            contentDescription = null,
                            modifier = Modifier.fillMaxSize().padding(24.dp).graphicsLayer(
                                rotationZ = rotation,
                                colorFilter = if (isBw) ColorFilter.colorMatrix(ColorMatrix().apply { setToSaturation(0f) }) else null
                            ),
                            contentScale = ContentScale.Fit
                        )
                    }

                    // Controles Inferiores
                    Column(Modifier.fillMaxWidth().background(Slate950).padding(20.dp)) {
                        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceEvenly) {
                            Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.clickable { rotation += 90f }) {
                                Box(Modifier.size(48.dp).background(Color.White.copy(0.1f), CircleShape), contentAlignment=Alignment.Center) { Icon(Icons.Default.RotateRight, null, tint=Color.White) }
                                Spacer(Modifier.height(8.dp)); Text("Rotar", color=Color.White, fontSize=12.sp)
                            }
                            Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.clickable { isBw = !isBw }) {
                                Box(Modifier.size(48.dp).background(if(isBw) Emerald500 else Color.White.copy(0.1f), CircleShape), contentAlignment=Alignment.Center) { Icon(Icons.Default.FilterBAndW, null, tint=Color.White) }
                                Spacer(Modifier.height(8.dp)); Text("B/N", color=Color.White, fontSize=12.sp)
                            }
                        }
                        Spacer(Modifier.height(24.dp))
                        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                            Button(onClick = { step = "camera"; tempBitmap = null }, modifier = Modifier.weight(1f).height(50.dp), colors = ButtonDefaults.buttonColors(containerColor = Slate800)) { Text("Repetir", color = Color.White) }

                            Button(
                                onClick = {
                                    if(isProcessing) return@Button
                                    isProcessing = true

                                    val matrix = Matrix().apply { postRotate(rotation) }
                                    var finalBitmap = Bitmap.createBitmap(tempBitmap!!, 0, 0, tempBitmap!!.width, tempBitmap!!.height, matrix, true)

                                    if (isBw) {
                                        val bwBitmap = Bitmap.createBitmap(finalBitmap.width, finalBitmap.height, Bitmap.Config.ARGB_8888)
                                        val canvas = android.graphics.Canvas(bwBitmap)
                                        val paint = Paint().apply { colorFilter = android.graphics.ColorMatrixColorFilter(android.graphics.ColorMatrix().apply { setSaturation(0f) }) }
                                        canvas.drawBitmap(finalBitmap, 0f, 0f, paint)
                                        finalBitmap = bwBitmap
                                    }

                                    if (isLandscape && frontBitmap == null) {
                                        frontBitmap = finalBitmap
                                        step = "camera"
                                        tempBitmap = null
                                        isProcessing = false
                                        Toast.makeText(context, "Frontal guardado. Ahora toma el REVERSO.", Toast.LENGTH_LONG).show()
                                    } else {
                                        try {
                                            val pdfDoc = PdfDocument()
                                            val pageInfo = PdfDocument.PageInfo.Builder(595, 842, 1).create() // A4
                                            val page = pdfDoc.startPage(pageInfo)
                                            val canvas = page.canvas

                                            if (isLandscape && frontBitmap != null) {
                                                val scaledFront = Bitmap.createScaledBitmap(frontBitmap!!, 500, 316, true)
                                                val scaledBack = Bitmap.createScaledBitmap(finalBitmap, 500, 316, true)
                                                canvas.drawBitmap(scaledFront, 47f, 50f, null)
                                                canvas.drawBitmap(scaledBack, 47f, 400f, null)
                                            } else {
                                                val scaledA4 = Bitmap.createScaledBitmap(finalBitmap, 555, (555f * (finalBitmap.height.toFloat()/finalBitmap.width.toFloat())).toInt(), true)
                                                canvas.drawBitmap(scaledA4, 20f, 20f, null)
                                            }

                                            pdfDoc.finishPage(page)
                                            val pdfFile = File(context.cacheDir, "scan_${System.currentTimeMillis()}.pdf")
                                            pdfDoc.writeTo(FileOutputStream(pdfFile))
                                            pdfDoc.close()

                                            onCapture(pdfFile)
                                        } catch (e: Exception) {
                                            isProcessing = false
                                            Toast.makeText(context, "Error generando PDF", Toast.LENGTH_SHORT).show()
                                        }
                                    }
                                },
                                modifier = Modifier.weight(1f).height(50.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = Emerald500)
                            ) {
                                if(isProcessing) CircularProgressIndicator(color=Color.White, modifier=Modifier.size(20.dp))
                                else Text(if(isLandscape && frontBitmap == null) "Siguiente" else "Confirmar PDF", fontWeight=FontWeight.Bold)
                            }
                        }
                    }
                }
            }
        }
    }
}

private fun resolveDocumentExtension(context: Context, uri: Uri): String {
    val mimeType = context.contentResolver.getType(uri)
    val extensionFromMime = mimeType?.let { MimeTypeMap.getSingleton().getExtensionFromMimeType(it) }
    if (!extensionFromMime.isNullOrBlank()) {
        return extensionFromMime.lowercase()
    }

    var displayName: String? = null
    context.contentResolver.query(uri, arrayOf(OpenableColumns.DISPLAY_NAME), null, null, null)?.use { cursor ->
        if (cursor.moveToFirst()) {
            displayName = cursor.getString(0)
        }
    }

    val fileName = displayName ?: uri.lastPathSegment.orEmpty()
    return fileName.substringAfterLast('.', "bin").ifBlank { "bin" }.lowercase()
}

@Composable
private fun DocumentSourceDialog(
    label: String,
    onDismiss: () -> Unit,
    onTakePhoto: () -> Unit,
    onPickFile: () -> Unit
) {
    Dialog(onDismissRequest = onDismiss, properties = DialogProperties(usePlatformDefaultWidth = false)) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(24.dp),
            shape = RoundedCornerShape(24.dp),
            colors = CardDefaults.cardColors(containerColor = Color.White)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(24.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Text("Cargar documento", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = Slate900)
                Text(label, fontSize = 14.sp, fontWeight = FontWeight.Medium, color = Slate500)

                OutlinedButton(
                    onClick = onPickFile,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(56.dp),
                    shape = RoundedCornerShape(16.dp),
                    border = BorderStroke(1.dp, Slate200)
                ) {
                    Icon(Icons.Default.Description, contentDescription = null, tint = Slate900)
                    Spacer(Modifier.width(10.dp))
                    Text("Subir archivo", color = Slate900, fontWeight = FontWeight.Bold)
                }

                Button(
                    onClick = onTakePhoto,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(56.dp),
                    shape = RoundedCornerShape(16.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Blue600, contentColor = Color.White)
                ) {
                    Icon(Icons.Default.CameraAlt, contentDescription = null)
                    Spacer(Modifier.width(10.dp))
                    Text("Tomar foto", fontWeight = FontWeight.Bold)
                }

                OutlinedButton(
                    onClick = onDismiss,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(52.dp),
                    shape = RoundedCornerShape(16.dp),
                    border = BorderStroke(1.dp, Slate200)
                ) {
                    Text("Cancelar", color = Slate500, fontWeight = FontWeight.Bold)
                }
            }
        }
    }
}

// --- UTILS UI (COMPOSABLES AUXILIARES)
@Composable fun AppInput(label: String, value: String, required: Boolean = false, keyboardOptions: KeyboardOptions = KeyboardOptions.Default, onValueChange: (String) -> Unit) { Column(Modifier.padding(bottom = 16.dp)) { Row(Modifier.padding(bottom = 6.dp, start = 4.dp)) { Text(label.uppercase(), fontSize = 11.sp, fontWeight = FontWeight.Bold, color = Slate400, letterSpacing = 0.5.sp); if(required) Text(" *", color = Red500, fontSize = 11.sp) }; OutlinedTextField(value = value, onValueChange = onValueChange, modifier = Modifier.fillMaxWidth(), shape = RoundedCornerShape(12.dp), colors = OutlinedTextFieldDefaults.colors(focusedBorderColor = Slate900, unfocusedBorderColor = Slate200, focusedContainerColor = Color.White, unfocusedContainerColor = Slate50.copy(0.5f), cursorColor = Slate900, focusedTextColor = Slate900, unfocusedTextColor = Slate900), keyboardOptions = keyboardOptions, singleLine = true, textStyle = TextStyle(fontSize = 14.sp, fontWeight = FontWeight.Medium)) } }
@Composable fun CardInputContainer(content: @Composable () -> Unit) { Card(colors = CardDefaults.cardColors(containerColor = Color.White), border = BorderStroke(1.dp, Slate200), modifier = Modifier.fillMaxWidth()) { Column(Modifier.padding(20.dp)) { content() } } }
@Composable fun SectionTitle(title: String, icon: ImageVector, showLine: Boolean = true) { Column(Modifier.padding(bottom = 16.dp, top = 8.dp)) { Row(verticalAlignment = Alignment.CenterVertically) { Icon(icon, null, tint = Slate400, modifier = Modifier.size(18.dp)); Spacer(Modifier.width(8.dp)); Text(title, fontSize = 16.sp, fontWeight = FontWeight.Bold, color = Slate900) }; if(showLine) Divider(color = Slate200, thickness = 1.dp, modifier = Modifier.padding(top = 8.dp)) } }
@Composable fun PensionOption(label: String, selected: Boolean, onClick: () -> Unit) { Box(modifier = Modifier.clip(RoundedCornerShape(8.dp)).background(if (selected) Slate900 else Color.Transparent).clickable { onClick() }.padding(vertical = 12.dp, horizontal = 24.dp).width(100.dp), contentAlignment = Alignment.Center) { Text(label, color = if (selected) Color.White else Slate500, fontWeight = FontWeight.Bold, fontSize = 13.sp) } }
@Composable fun StepIndicator(step: Int, icon: ImageVector, current: Int, label: String) { val active = current >= step; val currentStep = current == step; Column(horizontalAlignment = Alignment.CenterHorizontally) { Box(modifier = Modifier.size(32.dp).background(if (active) Slate900 else Slate100, CircleShape).border(if (currentStep) 2.dp else 0.dp, if(currentStep) Blue600 else Color.Transparent, CircleShape), contentAlignment = Alignment.Center) { Icon(icon, null, tint = if (active) Color.White else Slate300, modifier = Modifier.size(16.dp)) }; Text(label, fontSize = 10.sp, fontWeight = FontWeight.Bold, color = if (active) Slate900 else Slate300, modifier = Modifier.padding(top = 4.dp)) } }
@Composable fun SmallButton(text: String, icon: ImageVector, onClick: () -> Unit) { Button(onClick = onClick, contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp), colors = ButtonDefaults.buttonColors(containerColor = Blue600, contentColor = Color.White), shape = RoundedCornerShape(8.dp), modifier = Modifier.height(32.dp)) { Icon(icon, null, modifier = Modifier.size(14.dp)); Spacer(Modifier.width(4.dp)); Text(text, fontSize = 11.sp, fontWeight = FontWeight.Bold) } }
@Composable fun DocGrid(content: @Composable () -> Unit) { Column(verticalArrangement = Arrangement.spacedBy(12.dp)) { content() } }
@Composable fun DocItem(label: String, url: String?, onClick: () -> Unit) { val isUploaded = !url.isNullOrBlank(); val lowerUrl = url?.lowercase().orEmpty(); val statusText = when { !isUploaded -> "Tocar para cargar"; lowerUrl.endsWith(".pdf") -> "PDF cargado"; lowerUrl.endsWith(".jpg") || lowerUrl.endsWith(".jpeg") || lowerUrl.endsWith(".png") || lowerUrl.endsWith(".webp") -> "Imagen cargada"; else -> "Archivo cargado" }; Row(modifier = Modifier.fillMaxWidth().height(76.dp).clip(RoundedCornerShape(12.dp)).background(if (isUploaded) Emerald50 else Color.White).border(1.dp, if (isUploaded) Emerald500 else Slate200, RoundedCornerShape(12.dp)).clickable { onClick() }.padding(horizontal = 16.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.SpaceBetween) { Row(verticalAlignment = Alignment.CenterVertically) { Box(Modifier.size(40.dp).background(if(isUploaded) Emerald100 else Slate100, RoundedCornerShape(8.dp)), contentAlignment = Alignment.Center) { Icon(if(isUploaded) Icons.Default.Description else Icons.Default.CameraAlt, null, tint = if(isUploaded) Emerald600 else Slate400) }; Spacer(Modifier.width(12.dp)); Column { Text(label, fontWeight = FontWeight.Bold, fontSize = 13.sp, color = Slate900); Text(statusText, fontSize = 11.sp, color = if(isUploaded) Emerald600 else Slate400) } }; if(isUploaded) Icon(Icons.Default.CheckCircle, null, tint = Emerald500, modifier = Modifier.size(20.dp)) else Icon(Icons.Default.ChevronRight, null, tint = Slate300, modifier = Modifier.size(18.dp)) } }
@Composable fun ReadOnlyCard(title: String, icon: ImageVector, content: @Composable () -> Unit) { Card(colors = CardDefaults.cardColors(containerColor = Color.White), shape = RoundedCornerShape(20.dp), elevation = CardDefaults.cardElevation(4.dp), modifier = Modifier.fillMaxWidth()) { Column(Modifier.padding(20.dp)) { Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(bottom = 16.dp)) { Box(Modifier.size(36.dp).background(Slate50, CircleShape), contentAlignment = Alignment.Center) { Icon(icon, null, tint = Slate900, modifier = Modifier.size(18.dp)) }; Spacer(Modifier.width(12.dp)); Text(title, fontWeight = FontWeight.Bold, fontSize = 16.sp, color = Slate900) }; Divider(color = Slate100, modifier = Modifier.padding(bottom = 16.dp)); content() } } }
@Composable fun ReadOnlyField(label: String, value: String?, fullWidth: Boolean = false) { Column(Modifier.padding(bottom = 12.dp).then(if(fullWidth) Modifier.fillMaxWidth() else Modifier)) { Text(text = label.uppercase(), fontSize = 10.sp, color = Slate400, fontWeight = FontWeight.Bold, letterSpacing = 0.5.sp); Spacer(Modifier.height(4.dp)); Text(text = if (!value.isNullOrBlank()) value else "-", fontSize = 15.sp, fontWeight = FontWeight.SemiBold, color = if (!value.isNullOrBlank()) Slate800 else Slate300) } }
@Composable fun DocCheckItem(label: String, url: String?) { val uriHandler = LocalUriHandler.current; val isUploaded = !url.isNullOrBlank(); val lowerUrl = url?.lowercase().orEmpty(); val statusText = when { !isUploaded -> "Pendiente"; lowerUrl.endsWith(".pdf") -> "PDF disponible"; lowerUrl.endsWith(".jpg") || lowerUrl.endsWith(".jpeg") || lowerUrl.endsWith(".png") || lowerUrl.endsWith(".webp") -> "Imagen disponible"; else -> "Archivo disponible" }; Row(modifier = Modifier.fillMaxWidth().padding(vertical = 6.dp).clip(RoundedCornerShape(10.dp)).background(if(isUploaded) Emerald50.copy(0.5f) else Slate50, RoundedCornerShape(10.dp)).clickable(enabled = isUploaded) { if (url != null) uriHandler.openUri(url) }.padding(12.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.SpaceBetween) { Row(verticalAlignment = Alignment.CenterVertically) { Icon(if(isUploaded) Icons.Default.Description else Icons.Outlined.Description, null, tint = if(isUploaded) Slate700 else Slate400, modifier = Modifier.size(20.dp)); Spacer(Modifier.width(12.dp)); Column { Text(label, fontSize = 13.sp, fontWeight = FontWeight.Medium, color = if(isUploaded) Slate900 else Slate400); Text(statusText, fontSize = 11.sp, color = if(isUploaded) Emerald600 else Slate400) } }; if (isUploaded) Icon(Icons.Default.ChevronRight, null, tint = Emerald500, modifier = Modifier.size(20.dp)) else Icon(Icons.Default.Cancel, null, tint = Slate300, modifier = Modifier.size(20.dp)) } }
