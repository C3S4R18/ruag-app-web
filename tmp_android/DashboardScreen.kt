package com.ruag.digital.ui.screens

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.content.pm.PackageManager
import android.media.MediaPlayer
import android.net.Uri
import android.os.Build
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.*
import androidx.compose.animation.core.tween
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.material3.TabRowDefaults.tabIndicatorOffset
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import androidx.compose.ui.zIndex
import androidx.core.app.NotificationCompat
import androidx.core.content.ContextCompat
import androidx.navigation.NavController
import coil.compose.AsyncImage
import com.ruag.digital.R
import com.ruag.digital.data.SupabaseClient
import io.github.jan.supabase.gotrue.auth
import io.github.jan.supabase.postgrest.from
import io.github.jan.supabase.postgrest.query.Columns
import io.github.jan.supabase.postgrest.query.Order
import io.github.jan.supabase.realtime.PostgresAction
import io.github.jan.supabase.realtime.channel
import io.github.jan.supabase.realtime.postgresChangeFlow
import kotlinx.coroutines.launch
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.boolean
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.put
import java.time.Instant
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.util.Locale
import java.util.UUID
import androidx.compose.foundation.Canvas
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.IntrinsicSize

// --- PALETA DE COLORES ---
private val Slate900 = Color(0xFF0F172A)
private val Slate800 = Color(0xFF1E293B)
private val Slate700 = Color(0xFF334155)
private val Slate600 = Color(0xFF475569)
private val Slate500 = Color(0xFF64748B)
private val Slate400 = Color(0xFF94A3B8)
private val Slate300 = Color(0xFFCBD5E1)
private val Slate200 = Color(0xFFE2E8F0)
private val Slate100 = Color(0xFFF1F5F9)
private val Slate50 = Color(0xFFF8FAFC)

private val Blue600 = Color(0xFF2563EB)
private val Blue700 = Color(0xFF1D4ED8)
private val Blue100 = Color(0xFFDBEAFE)
private val Blue50 = Color(0xFFEFF6FF)

private val Emerald600 = Color(0xFF059669)
private val Emerald500 = Color(0xFF10B981)
private val Emerald400 = Color(0xFF34D399)
private val Emerald100 = Color(0xFFD1FAE5)
private val Emerald50 = Color(0xFFECFDF5)

private val Amber900 = Color(0xFF78350F)
private val Amber100 = Color(0xFFFEF3C7)
private val Amber50 = Color(0xFFFFFBEB)

private val Red500 = Color(0xFFEF4444)
private val Red50 = Color(0xFFFEF2F2)

private val Purple600 = Color(0xFF7C3AED)

// --- CONFIGURACION DE DOCUMENTOS ---
private const val WORKER_PORTAL_BASE_URL = "https://ruag-app-web.vercel.app"
private const val HIDDEN_APP_DOC_KEY = "induccion"

private val DOCS_SSOMA_ALL = linkedMapOf(
    "risst" to "Cargo RISST",
    "capacitacion" to "Registro Capacitacion",
    "induccion" to "Induccion Hombre Nuevo",
    "epp" to "Entrega de EPPs",
    "acta_derecho" to "Acta Derecho a Saber",
    "iperc" to "Entrega IPERC"
)

private val DOCS_SSOMA = DOCS_SSOMA_ALL.filterKeys { it != HIDDEN_APP_DOC_KEY }

private val DOCS_RRHH = linkedMapOf(
    "cargo_rit" to "Cargo RIT",
    "cargo_politica_prevencion" to "Cargo Politica Prevencion"
)

private val ADMIN_UPLOADS_CONFIG = linkedMapOf(
    "cap_iperc" to "CAPACITACION IPERC",
    "cap_pets" to "CAPACITACION PETS",
    "rec_sst" to "RECOMENDACIONES SST",
    "acta_saber" to "ACTA DERECHO A SABER",
    "acta_acatamiento" to "ACTA ACATAMIENTO",
    "entre_epp" to "ENTREGA EPP",
    "reg_induccion" to "REGISTRO DE INDUCCION",
    "dif_pol_sst" to "DIFUSION POLITICA DE SST",
    "cap_hostigamiento" to "CAPACITACION HOSTIGAMIENTO SEXUAL",
    "reg_risst" to "REGISTRO RISST",
    "camo" to "CAMO",
    "acta_emo" to "ACTA DE ENTREGA EMO",
    "cap_covid" to "CAPACITACION PLAN COVID",
    "acta_iperc" to "ACTA IPERC",
    "ficha_covid" to "FICHA COVID"
)

private val MANDATORY_DOWNLOADS = linkedMapOf(
    "risst_pdf_download" to ("REGLAMENTO%20INTERNO%20DE%20SEGURIDAD.pdf" to "Reglamento Interno RISST"),
    "rit_pdf_download" to ("REGLAMENTO%20INTERNO%20DE%20TRABAJO.pdf" to "Reglamento Interno de Trabajo"),
    "hostigamiento_pdf_download" to ("POLITICA%20DE%20HOSTIGAMIENTO%20SEXUAL.pdf" to "Politica de Hostigamiento"),
    "beneficiarios_pdf_download" to ("DECLARACION%20DE%20BENEFICIARIOS_VIDA%20LEY_2019.pdf" to "Declaracion Beneficiarios Vida Ley"),
    "calidad_pdf_download" to ("POLITICA%20DE%20CALIDAD.pdf" to "Politica de Calidad"),
    "etica_pdf_download" to ("CODIGO%20DE%20ETICA%20Y%20CONDUCTA.pdf" to "Codigo de Etica y Conducta"),
    "antisoborno_pdf_download" to ("POLITICA%20ANTISOBORNO%20Y%20ANTICORRUPCI%C3%93N.pdf" to "Politica Antisoborno")
)

private val ALL_DOC_LABELS = DOCS_SSOMA + DOCS_RRHH

// --- MODELOS DE DATOS ---
data class NotificationItem(
    val id: String = UUID.randomUUID().toString(),
    val message: String,
    val time: String,
    var read: Boolean = false
)

data class ChatMessage(
    val id: String,
    val content: String,
    val sender_id: String,
    val created_at: String,
    val is_admin: Boolean,
    val sender_role: String? = "worker"
)

data class DocStatus(
    val key: String,
    val label: String,
    val status: String,
    val category: String
)

data class AdminFileStatus(
    val key: String,
    val label: String,
    val isAvailable: Boolean,
    val url: String?,
    val uploadedAt: String?
)

data class MandatoryDownloadItem(
    val key: String,
    val file: String,
    val label: String
)
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(navController: NavController) {
    val scope = rememberCoroutineScope()
    val context = LocalContext.current
    val uriHandler = LocalUriHandler.current
    val snackbarHostState = remember { SnackbarHostState() }

    val drawerState = rememberDrawerState(initialValue = DrawerValue.Closed)

    var selectedTab by remember { mutableIntStateOf(0) }
    var userId by remember { mutableStateOf("") }
    var userName by remember { mutableStateOf("Companero") }
    var userEmail by remember { mutableStateOf("") }
    var userInitial by remember { mutableStateOf("R") }

    var fichaId by remember { mutableStateOf<String?>(null) }
    var currentFichaData by remember { mutableStateOf<JsonObject?>(null) }
    var fullDocStatesJson by remember { mutableStateOf<JsonObject?>(null) }
    var fullUploadsJson by remember { mutableStateOf<JsonObject?>(null) }
    var currentFichaStatus by remember { mutableStateOf("") }

    var ssomaList by remember { mutableStateOf<List<DocStatus>>(emptyList()) }
    var rrhhList by remember { mutableStateOf<List<DocStatus>>(emptyList()) }
    var adminUploadsList by remember { mutableStateOf<List<AdminFileStatus>>(emptyList()) }
    var downloadQueue by remember { mutableStateOf<List<MandatoryDownloadItem>>(emptyList()) }

    var stats by remember { mutableStateOf(mapOf("total" to 0, "completed" to 0)) }
    var messages by remember { mutableStateOf<List<ChatMessage>>(emptyList()) }
    val notifications = remember { mutableStateListOf<NotificationItem>() }
    var showNotifications by remember { mutableStateOf(false) }
    var unreadMessagesCount by remember { mutableIntStateOf(0) }
    var showChatSheet by remember { mutableStateOf(false) }
    var docToFill by remember { mutableStateOf<String?>(null) }

    val unreadCount = notifications.count { !it.read }
    val pendingDocsCount = (ssomaList + rrhhList).count { it.status == "unlocked" }
    val pendingActionsCount = pendingDocsCount + downloadQueue.size

    LaunchedEffect(Unit) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel("ruag_updates", "Actualizaciones RUAG", NotificationManager.IMPORTANCE_HIGH)
            val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.createNotificationChannel(channel)
        }
    }

    val launcher = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) {}
    LaunchedEffect(Unit) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU &&
            ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
        ) {
            launcher.launch(Manifest.permission.POST_NOTIFICATIONS)
        }
    }

    fun playNotificationSound() {
        try {
            val mediaPlayer = MediaPlayer.create(context, R.raw.notification)
            mediaPlayer?.setOnCompletionListener { mp -> mp.release() }
            mediaPlayer?.start()
        } catch (_: Exception) {
        }
    }

    fun showSystemNotification(title: String, content: String) {
        if (ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED) {
            val builder = NotificationCompat.Builder(context, "ruag_updates")
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle(title)
                .setContentText(content)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setAutoCancel(true)
            val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.notify(System.currentTimeMillis().toInt(), builder.build())
        }
        playNotificationSound()
    }

    fun addNotification(message: String, title: String? = null, time: String = "Ahora", notifySystem: Boolean = false) {
        notifications.removeAll { it.message == message }
        notifications.add(0, NotificationItem(message = message, time = time))
        if (notifySystem) {
            showSystemNotification(title ?: "RUAG Digital", message)
        }
    }

    fun getStatus(source: JsonObject?, key: String): String {
        return source?.get(key)?.jsonObject?.get("status")?.jsonPrimitive?.content ?: "locked"
    }

    fun buildDownloadQueueFromStates(docStates: JsonObject?): List<MandatoryDownloadItem> {
        return MANDATORY_DOWNLOADS.mapNotNull { (key, config) ->
            if (getStatus(docStates, key) == "pending_download") {
                MandatoryDownloadItem(key = key, file = config.first, label = config.second)
            } else {
                null
            }
        }
    }

    suspend fun markMandatoryDownloadAsCompleted(item: MandatoryDownloadItem) {
        val targetFichaId = fichaId ?: return
        val currentMap = fullDocStatesJson?.toMutableMap() ?: mutableMapOf()
        val currentEntry = currentMap[item.key]?.jsonObject
        currentMap[item.key] = buildJsonObject {
            put("status", "downloaded")
            put("downloaded_at", Instant.now().toString())
            currentEntry?.get("data")?.let { put("data", it) }
        }
        SupabaseClient.client.from("fichas").update(mapOf("doc_states" to JsonObject(currentMap))) {
            filter { eq("id", targetFichaId) }
        }
        fullDocStatesJson = JsonObject(currentMap)
        downloadQueue = downloadQueue.filterNot { it.key == item.key }
    }

    fun processFichaData(ficha: JsonObject, isRealtimeUpdate: Boolean = false) {
        currentFichaData = ficha
        val docStates = ficha["doc_states"]?.jsonObject ?: JsonObject(emptyMap())
        val uploadsState = ficha["uploads_state"]?.jsonObject ?: JsonObject(emptyMap())
        val oldDocStates = fullDocStatesJson ?: JsonObject(emptyMap())
        val oldUploads = fullUploadsJson ?: JsonObject(emptyMap())

        if (isRealtimeUpdate) {
            ALL_DOC_LABELS.forEach { (key, label) ->
                val oldStatus = getStatus(oldDocStates, key)
                val newStatus = getStatus(docStates, key)
                if (oldStatus != "unlocked" && newStatus == "unlocked") {
                    addNotification(
                        message = "Se habilito el documento: $label",
                        title = "Documento habilitado",
                        notifySystem = true
                    )
                }
            }

            MANDATORY_DOWNLOADS.forEach { (key, config) ->
                val oldStatus = getStatus(oldDocStates, key)
                val newStatus = getStatus(docStates, key)
                if (oldStatus != "pending_download" && newStatus == "pending_download") {
                    addNotification(
                        message = "Documento obligatorio recibido: ${config.second}",
                        title = "Descarga requerida",
                        notifySystem = true
                    )
                }
            }

            ADMIN_UPLOADS_CONFIG.forEach { (key, label) ->
                val oldUrl = oldUploads[key]?.jsonObject?.get("url")?.jsonPrimitive?.content
                val newUrl = uploadsState[key]?.jsonObject?.get("url")?.jsonPrimitive?.content
                if (oldUrl == null && !newUrl.isNullOrBlank()) {
                    addNotification(
                        message = "SSOMA subio un nuevo archivo: $label",
                        title = "Nuevo archivo SSOMA",
                        notifySystem = true
                    )
                }
            }
        }

        fullDocStatesJson = docStates
        fullUploadsJson = uploadsState
        downloadQueue = buildDownloadQueueFromStates(docStates)

        ssomaList = DOCS_SSOMA.map { (key, label) ->
            DocStatus(key = key, label = label, status = getStatus(docStates, key), category = "ssoma")
        }
        rrhhList = DOCS_RRHH.map { (key, label) ->
            DocStatus(key = key, label = label, status = getStatus(docStates, key), category = "rrhh")
        }
        adminUploadsList = ADMIN_UPLOADS_CONFIG.map { (key, label) ->
            val fileData = uploadsState[key]?.jsonObject
            val url = fileData?.get("url")?.jsonPrimitive?.content
            val uploadedAt = fileData?.get("uploaded_at")?.jsonPrimitive?.content
            AdminFileStatus(
                key = key,
                label = label,
                isAvailable = !url.isNullOrBlank(),
                url = url,
                uploadedAt = uploadedAt
            )
        }

        val allUserDocs = ssomaList + rrhhList
        stats = mapOf(
            "total" to allUserDocs.size,
            "completed" to allUserDocs.count { it.status == "completed" }
        )
    }

    LaunchedEffect(Unit) {
        val user = SupabaseClient.client.auth.currentUserOrNull() ?: return@LaunchedEffect
        userId = user.id
        userEmail = user.email ?: ""

        try {
            val profile = SupabaseClient.client.from("profiles")
                .select(columns = Columns.list("nombres")) { filter { eq("id", user.id) } }
                .decodeSingleOrNull<JsonObject>()

            val fullName = profile?.get("nombres")?.jsonPrimitive?.content?.trim().orEmpty()
            val firstToken = fullName.split(" ").firstOrNull { it.isNotBlank() }
                ?: userEmail.substringBefore("@").ifBlank { "Companero" }

            userName = firstToken.replaceFirstChar {
                if (it.isLowerCase()) it.titlecase(Locale.getDefault()) else it.toString()
            }
            userInitial = firstToken.take(1).uppercase().ifBlank { "R" }

            val ficha = SupabaseClient.client.from("fichas")
                .select { filter { eq("user_id", user.id) } }
                .decodeSingleOrNull<JsonObject>()

            if (ficha != null) {
                fichaId = ficha["id"]?.jsonPrimitive?.content
                currentFichaStatus = ficha["estado"]?.jsonPrimitive?.content ?: ""
                if (currentFichaStatus != "completado") {
                    addNotification("Recuerda que debes completar tu Ficha de Datos.", time = "Sistema")
                }
                processFichaData(ficha, isRealtimeUpdate = false)
            } else {
                addNotification("Recuerda que debes completar tu Ficha de Datos.", time = "Sistema")
            }

            val history = SupabaseClient.client.from("messages").select {
                filter { eq("worker_id", user.id) }
                order("created_at", order = Order.ASCENDING)
            }.decodeList<JsonObject>()

            messages = history.map {
                val senderRole = it["sender_role"]?.jsonPrimitive?.content ?: "worker"
                ChatMessage(
                    id = it["id"]?.jsonPrimitive?.content ?: "",
                    content = it["content"]?.jsonPrimitive?.content ?: "",
                    sender_id = it["sender_id"]?.jsonPrimitive?.content ?: "",
                    created_at = it["created_at"]?.jsonPrimitive?.content ?: "",
                    is_admin = it["is_admin"]?.jsonPrimitive?.boolean ?: (senderRole == "admin"),
                    sender_role = senderRole
                )
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    DisposableEffect(userId) {
        if (userId.isEmpty()) return@DisposableEffect onDispose { }

        val channel = SupabaseClient.client.channel("dashboard-${UUID.randomUUID()}")
        val messageFlow = channel.postgresChangeFlow<PostgresAction.Insert>(schema = "public") {
            table = "messages"
            filter = "worker_id=eq.$userId"
        }
        val fichaFlow = channel.postgresChangeFlow<PostgresAction.Update>(schema = "public") {
            table = "fichas"
            filter = "user_id=eq.$userId"
        }

        val job = scope.launch {
            channel.subscribe()

            launch {
                messageFlow.collect { change ->
                    val record = change.record
                    val id = record["id"]?.jsonPrimitive?.content ?: ""
                    if (messages.none { it.id == id }) {
                        val senderId = record["sender_id"]?.jsonPrimitive?.content ?: ""
                        val newMessage = ChatMessage(
                            id = id,
                            content = record["content"]?.jsonPrimitive?.content ?: "",
                            sender_id = senderId,
                            created_at = record["created_at"]?.jsonPrimitive?.content ?: "",
                            is_admin = record["is_admin"]?.jsonPrimitive?.boolean ?: false,
                            sender_role = record["sender_role"]?.jsonPrimitive?.content ?: "worker"
                        )
                        messages = messages + newMessage
                        if (senderId != userId) {
                            val preview = if (newMessage.content.length > 80) {
                                "${newMessage.content.take(80)}..."
                            } else {
                                newMessage.content
                            }
                            addNotification(
                                message = "Soporte SSOMA: $preview",
                                title = "Soporte SSOMA",
                                notifySystem = true
                            )
                            if (!showChatSheet) unreadMessagesCount++
                        }
                    }
                }
            }

            launch {
                fichaFlow.collect { change ->
                    val newRecord = change.record
                    val previousStatus = currentFichaStatus
                    processFichaData(newRecord, isRealtimeUpdate = true)
                    val newStatus = newRecord["estado"]?.jsonPrimitive?.content ?: ""
                    if (newStatus == "completado" && previousStatus != "completado") {
                        addNotification(
                            message = "Tu ficha ha sido validada por la administracion.",
                            title = "Ficha validada",
                            notifySystem = true
                        )
                    }
                    currentFichaStatus = newStatus
                }
            }
        }

        onDispose {
            scope.launch { channel.unsubscribe() }
            job.cancel()
        }
    }

    ModalNavigationDrawer(
        drawerState = drawerState,
        drawerContent = {
            ModalDrawerSheet(
                drawerContainerColor = Color.White,
                drawerShape = RoundedCornerShape(topEnd = 32.dp, bottomEnd = 32.dp),
                modifier = Modifier.width(300.dp).background(Color.White)
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(Brush.verticalGradient(listOf(Blue50, Color.White)))
                        .padding(start = 32.dp, end = 32.dp, top = 48.dp, bottom = 32.dp)
                ) {
                    Column {
                        Box(
                            modifier = Modifier
                                .size(72.dp)
                                .background(Brush.linearGradient(listOf(Blue600, Blue700)), CircleShape)
                                .border(3.dp, Color.White, CircleShape)
                                .shadow(8.dp, CircleShape),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(userInitial, color = Color.White, fontSize = 28.sp, fontWeight = FontWeight.Bold)
                        }
                        Spacer(Modifier.height(16.dp))
                        Text(userName, color = Slate900, fontSize = 24.sp, fontWeight = FontWeight.ExtraBold)
                        Text("Portal Obrero", color = Slate500, fontSize = 14.sp, fontWeight = FontWeight.Medium)
                    }
                }

                Spacer(Modifier.height(8.dp))

                NavigationDrawerItem(
                    label = { Text("Inicio", fontWeight = FontWeight.Bold, fontSize = 15.sp) },
                    icon = { Icon(if (selectedTab == 0) Icons.Default.Home else Icons.Outlined.Home, null, modifier = Modifier.size(22.dp)) },
                    selected = selectedTab == 0,
                    onClick = { selectedTab = 0; scope.launch { drawerState.close() } },
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 6.dp),
                    colors = NavigationDrawerItemDefaults.colors(
                        selectedContainerColor = Blue50,
                        unselectedContainerColor = Color.Transparent,
                        selectedIconColor = Blue600,
                        unselectedIconColor = Slate500,
                        selectedTextColor = Blue600,
                        unselectedTextColor = Slate700
                    )
                )
                NavigationDrawerItem(
                    label = {
                        Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            Text("Mis Registros", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                            if (pendingActionsCount > 0) {
                                Box(
                                    modifier = Modifier
                                        .background(Red50, RoundedCornerShape(999.dp))
                                        .padding(horizontal = 8.dp, vertical = 2.dp)
                                ) {
                                    Text(
                                        pendingActionsCount.toString(),
                                        color = Red500,
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.ExtraBold
                                    )
                                }
                            }
                        }
                    },
                    icon = { Icon(if (selectedTab == 1) Icons.Default.Description else Icons.Outlined.Description, null, modifier = Modifier.size(22.dp)) },
                    selected = selectedTab == 1,
                    onClick = { selectedTab = 1; scope.launch { drawerState.close() } },
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 6.dp),
                    colors = NavigationDrawerItemDefaults.colors(
                        selectedContainerColor = Blue50,
                        unselectedContainerColor = Color.Transparent,
                        selectedIconColor = Blue600,
                        unselectedIconColor = Slate500,
                        selectedTextColor = Blue600,
                        unselectedTextColor = Slate700
                    )
                )
                NavigationDrawerItem(
                    label = { Text("Archivos SSOMA", fontWeight = FontWeight.Bold, fontSize = 15.sp) },
                    icon = { Icon(if (selectedTab == 2) Icons.Default.Folder else Icons.Outlined.Folder, null, modifier = Modifier.size(22.dp)) },
                    selected = selectedTab == 2,
                    onClick = { selectedTab = 2; scope.launch { drawerState.close() } },
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 6.dp),
                    colors = NavigationDrawerItemDefaults.colors(
                        selectedContainerColor = Blue50,
                        unselectedContainerColor = Color.Transparent,
                        selectedIconColor = Blue600,
                        unselectedIconColor = Slate500,
                        selectedTextColor = Blue600,
                        unselectedTextColor = Slate700
                    )
                )
                NavigationDrawerItem(
                    label = { Text("Mi Perfil", fontWeight = FontWeight.Bold, fontSize = 15.sp) },
                    icon = { Icon(if (selectedTab == 3) Icons.Default.Person else Icons.Outlined.Person, null, modifier = Modifier.size(22.dp)) },
                    selected = selectedTab == 3,
                    onClick = { selectedTab = 3; scope.launch { drawerState.close() } },
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 6.dp),
                    colors = NavigationDrawerItemDefaults.colors(
                        selectedContainerColor = Blue50,
                        unselectedContainerColor = Color.Transparent,
                        selectedIconColor = Blue600,
                        unselectedIconColor = Slate500,
                        selectedTextColor = Blue600,
                        unselectedTextColor = Slate700
                    )
                )

                Spacer(Modifier.weight(1f))

                HorizontalDivider(color = Slate100, modifier = Modifier.padding(horizontal = 24.dp))

                NavigationDrawerItem(
                    label = { Text("Cerrar Sesion", color = Red500, fontWeight = FontWeight.Bold, fontSize = 15.sp) },
                    icon = { Icon(Icons.Outlined.Logout, null, tint = Red500, modifier = Modifier.size(22.dp)) },
                    selected = false,
                    onClick = { scope.launch { SupabaseClient.client.auth.signOut(); navController.navigate("login") { popUpTo(0) } } },
                    modifier = Modifier.padding(16.dp),
                    colors = NavigationDrawerItemDefaults.colors(unselectedContainerColor = Color.Transparent)
                )
            }
        }
    ) {
        Scaffold(
            snackbarHost = { SnackbarHost(hostState = snackbarHostState) },
            containerColor = Slate50,
            topBar = {
                CenterAlignedTopAppBar(
                    title = {
                        Text(
                            when (selectedTab) {
                                0 -> "Bienvenido"
                                1 -> "Mis Registros"
                                2 -> "Archivos SSOMA"
                                else -> "Mi Perfil"
                            },
                            fontWeight = FontWeight.Bold,
                            fontSize = 18.sp,
                            color = Slate900
                        )
                    },
                    navigationIcon = {
                        IconButton(onClick = { scope.launch { drawerState.open() } }) {
                            Icon(Icons.Default.Menu, contentDescription = "Menu", tint = Slate800)
                        }
                    },
                    actions = {
                        Box {
                            IconButton(onClick = {
                                showNotifications = !showNotifications
                                if (showNotifications) notifications.forEach { it.read = true }
                            }) {
                                Icon(Icons.Outlined.Notifications, contentDescription = "Notificaciones", tint = Slate800)
                            }
                            if (unreadCount > 0) {
                                Box(modifier = Modifier.align(Alignment.TopEnd).padding(8.dp).size(10.dp).background(Red500, CircleShape).border(2.dp, Color.White, CircleShape))
                            }
                        }
                    },
                    colors = TopAppBarDefaults.centerAlignedTopAppBarColors(containerColor = Color.White.copy(alpha = 0.95f))
                )
            },
            floatingActionButton = {
                Box {
                    FloatingActionButton(
                        onClick = { showChatSheet = true; unreadMessagesCount = 0 },
                        containerColor = Slate900,
                        contentColor = Color.White,
                        shape = CircleShape,
                        elevation = FloatingActionButtonDefaults.elevation(8.dp)
                    ) { Icon(Icons.Default.ChatBubble, "Soporte") }
                    if (unreadMessagesCount > 0) {
                        Box(modifier = Modifier.align(Alignment.TopEnd).offset(4.dp, (-4).dp).size(22.dp).background(Red500, CircleShape).border(2.dp, Color.White, CircleShape), contentAlignment = Alignment.Center) {
                            Text(unreadMessagesCount.toString(), color = Color.White, fontSize = 11.sp, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        ) { padding ->
            Box(modifier = Modifier.padding(padding).fillMaxSize()) {

                AnimatedContent(
                    targetState = selectedTab,
                    transitionSpec = {
                        (slideInHorizontally(animationSpec = tween(300)) { width -> if (targetState > initialState) width else -width } + fadeIn(tween(300)))
                            .togetherWith(slideOutHorizontally(animationSpec = tween(300)) { width -> if (targetState > initialState) -width else width } + fadeOut(tween(300)))
                    },
                    label = "tab_transition"
                ) { tab ->
                    when (tab) {
                        0 -> HomeView(navController, userName, userInitial, stats)
                        1 -> DocumentsView(
                            ssomaDocs = ssomaList,
                            rrhhDocs = rrhhList,
                            onDocClick = { doc ->
                                when (doc.status) {
                                    "unlocked" -> docToFill = doc.key
                                    "completed" -> Toast.makeText(context, "Este documento ya fue firmado.", Toast.LENGTH_SHORT).show()
                                    else -> Toast.makeText(context, "Documento bloqueado", Toast.LENGTH_SHORT).show()
                                }
                            }
                        )
                        2 -> UploadsView(
                            adminUploads = adminUploadsList,
                            onAdminFileClick = { file -> if (!file.url.isNullOrBlank()) uriHandler.openUri(file.url) }
                        )
                        else -> ProfileView(
                            navController = navController,
                            userName = userName,
                            initial = userInitial,
                            userEmail = userEmail,
                            onEmailUpdated = { userEmail = it }
                        )
                    }
                }

                AnimatedVisibility(
                    visible = showNotifications,
                    enter = fadeIn() + slideInVertically { -40 },
                    exit = fadeOut() + slideOutVertically { -40 },
                    modifier = Modifier.align(Alignment.TopEnd).padding(top = 8.dp, end = 16.dp).zIndex(50f)
                ) {
                    Card(
                        modifier = Modifier.width(320.dp).shadow(24.dp, RoundedCornerShape(16.dp)),
                        colors = CardDefaults.cardColors(containerColor = Color.White),
                        shape = RoundedCornerShape(16.dp)
                    ) {
                        Column {
                            Row(Modifier.fillMaxWidth().padding(16.dp), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                                Text("Novedades", fontWeight = FontWeight.Bold, fontSize = 16.sp, color = Slate900)
                                Text("Limpiar", color = Blue600, fontSize = 12.sp, fontWeight = FontWeight.Bold, modifier = Modifier.clickable { notifications.clear(); showNotifications = false })
                            }
                            HorizontalDivider(color = Slate100)
                            if (notifications.isEmpty()) {
                                Box(Modifier.fillMaxWidth().padding(32.dp), contentAlignment = Alignment.Center) {
                                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                        Icon(Icons.Outlined.NotificationsNone, null, tint = Slate300, modifier = Modifier.size(40.dp))
                                        Spacer(Modifier.height(8.dp))
                                        Text("Estas al dia", color = Slate500, fontSize = 14.sp)
                                    }
                                }
                            } else {
                                LazyColumn(modifier = Modifier.heightIn(max = 300.dp)) {
                                    items(notifications) { notif ->
                                        Row(Modifier.fillMaxWidth().clickable { }.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                                            Box(Modifier.size(40.dp).background(Blue50, CircleShape), contentAlignment = Alignment.Center) { Icon(Icons.Default.Info, null, tint = Blue600) }
                                            Spacer(Modifier.width(12.dp))
                                            Column(Modifier.weight(1f)) {
                                                Text(notif.message, fontWeight = FontWeight.Medium, color = Slate900, fontSize = 13.sp, lineHeight = 18.sp)
                                                Text(notif.time, color = Slate500, fontSize = 11.sp, modifier = Modifier.padding(top=4.dp))
                                            }
                                        }
                                        HorizontalDivider(color = Slate50)
                                    }
                                }
                            }
                        }
                    }
                }

                if (showNotifications) {
                    Box(modifier = Modifier.fillMaxSize().background(Color.Transparent).clickable(interactionSource = remember { androidx.compose.foundation.interaction.MutableInteractionSource() }, indication = null) { showNotifications = false })
                }
            }
        }
    }

    if (showChatSheet) {
        ChatBottomSheet(
            userId = userId,
            messages = messages,
            onSendMessage = { content ->
                scope.launch {
                    try {
                        val json = buildJsonObject {
                            put("content", content)
                            put("sender_id", userId)
                            put("worker_id", userId)
                            put("is_admin", false)
                            put("sender_role", "worker")
                        }
                        SupabaseClient.client.from("messages").insert(json)
                    } catch (_: Exception) {
                    }
                }
            },
            onDismiss = { showChatSheet = false }
        )
    }

    if (docToFill != null) {
        DocumentModal(
            title = ALL_DOC_LABELS[docToFill] ?: "",
            content = {
                when (docToFill) {
                    "risst" -> CargoRisstLayout(currentFichaData)
                    "capacitacion" -> RegistroCapacitacionLayout(currentFichaData)
                    "epp" -> EntregaEppLayout(currentFichaData)
                    "acta_derecho" -> ActaDerechoSaberLayout(currentFichaData)
                    "iperc" -> ActaEntregaIpercLayout(currentFichaData)
                    "cargo_rit" -> CargoRitLayout(currentFichaData)
                    "cargo_politica_prevencion" -> CargoPoliticaPrevencionLayout(currentFichaData)
                    else -> RenderDocumentContent(docToFill!!, currentFichaData)
                }
            },
            onClose = { docToFill = null },
            onConfirm = {
                scope.launch {
                    try {
                        if (fichaId != null && fullDocStatesJson != null) {
                            val currentMap = fullDocStatesJson!!.toMutableMap()
                            val dataMap = buildJsonObject { put("signed", true) }
                            val docObj = buildJsonObject {
                                put("status", "completed")
                                put("completed_at", LocalDate.now().toString())
                                put("data", dataMap)
                            }
                            currentMap[docToFill!!] = docObj
                            SupabaseClient.client.from("fichas").update(mapOf("doc_states" to JsonObject(currentMap))) {
                                filter { eq("id", fichaId!!) }
                            }
                            fullDocStatesJson = JsonObject(currentMap)
                            docToFill = null
                            Toast.makeText(context, "Firmado correctamente", Toast.LENGTH_SHORT).show()
                        }
                    } catch (e: Exception) {
                        Toast.makeText(context, "No se pudo firmar: ${e.message}", Toast.LENGTH_SHORT).show()
                    }
                }
            }
        )
    }

    if (downloadQueue.isNotEmpty()) {
        MandatoryDownloadModal(
            item = downloadQueue.first(),
            queueCount = downloadQueue.size,
            onDownload = {
                scope.launch {
                    val currentItem = downloadQueue.firstOrNull() ?: return@launch
                    try {
                        uriHandler.openUri("${WORKER_PORTAL_BASE_URL}/${currentItem.file}")
                        markMandatoryDownloadAsCompleted(currentItem)
                        snackbarHostState.showSnackbar("Documento marcado como descargado.")
                    } catch (_: Exception) {
                        Toast.makeText(context, "No se pudo abrir el documento.", Toast.LENGTH_SHORT).show()
                    }
                }
            }
        )
    }
}

// --------------------------------------------------------
// VISTAS PRINCIPALES REDISEÃ‘ADAS
// --------------------------------------------------------

@Composable
fun HomeView(navController: NavController, name: String, initial: String, stats: Map<String, Int>) {
    val today = LocalDate.now().format(DateTimeFormatter.ofPattern("EEEE, d 'de' MMMM", Locale("es", "ES")))
    val progress = if (stats["total"] == 0) 0f else (stats["completed"]?.toFloat() ?: 0f) / (stats["total"]?.toFloat() ?: 1f)

    LazyColumn(modifier = Modifier.fillMaxSize(), contentPadding = PaddingValues(bottom = 80.dp)) {
        item {
            // Hero Card Moderno
            Box(modifier = Modifier.fillMaxWidth().padding(16.dp)) {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(24.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.Transparent),
                    elevation = CardDefaults.cardElevation(8.dp)
                ) {
                    Box(modifier = Modifier.fillMaxWidth().background(Brush.linearGradient(listOf(Blue700, Slate900))).padding(24.dp)) {
                        Box(modifier = Modifier.align(Alignment.TopEnd).offset(x = 40.dp, y = (-20).dp).size(150.dp).background(Color.White.copy(alpha = 0.05f), CircleShape))

                        Column {
                            Box(Modifier.background(Color.White.copy(0.15f), RoundedCornerShape(50)).padding(horizontal = 12.dp, vertical = 6.dp)) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(Icons.Default.CalendarToday, null, tint = Color.White, modifier = Modifier.size(14.dp))
                                    Spacer(Modifier.width(6.dp))
                                    Text(text = today.replaceFirstChar { it.uppercase() }, color = Color.White, fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                }
                            }
                            Spacer(modifier = Modifier.height(16.dp))
                            Text(text = "Hola, $name ðŸ‘‹", color = Color.White, fontSize = 28.sp, fontWeight = FontWeight.ExtraBold)
                            Text(text = "AquÃ­ tienes un resumen de tu avance.", color = Blue100, fontSize = 14.sp, modifier = Modifier.padding(top=4.dp))

                            Spacer(Modifier.height(32.dp))

                            Row(Modifier.fillMaxWidth().background(Color.White.copy(0.1f), RoundedCornerShape(16.dp)).border(1.dp, Color.White.copy(0.2f), RoundedCornerShape(16.dp)).padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                                Box(Modifier.size(50.dp), contentAlignment = Alignment.Center) {
                                    CircularProgressIndicator(progress = { 1f }, modifier = Modifier.fillMaxSize(), color = Color.White.copy(0.2f), strokeWidth = 5.dp)
                                    CircularProgressIndicator(progress = { progress }, modifier = Modifier.fillMaxSize(), color = Emerald400, strokeWidth = 5.dp)
                                    Text("${(progress * 100).toInt()}%", fontSize = 13.sp, fontWeight = FontWeight.Bold, color = Color.White)
                                }
                                Spacer(Modifier.width(16.dp))
                                Column {
                                    Text("DOCUMENTACIÃ“N", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Emerald400, letterSpacing = 1.sp)
                                    Text("${stats["completed"]} de ${stats["total"]} completados", fontSize = 16.sp, fontWeight = FontWeight.Bold, color = Color.White)
                                }
                            }
                        }
                    }
                }
            }
        }
        item {
            Column(modifier = Modifier.fillMaxWidth().padding(horizontal = 20.dp, vertical = 8.dp)) {
                Text("Accesos RÃ¡pidos", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Slate900)
                Spacer(modifier = Modifier.height(16.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                    ModernActionButton(Modifier.weight(1f), "Actualizar Ficha", "Tus datos", Icons.Outlined.Badge, Blue600, Blue50) { navController.navigate("worker_form") }
                    // ModernActionButton(Modifier.weight(1f), "InducciÃ³n", "SSOMA Video", Icons.Outlined.Shield, Emerald600, Emerald50) { navController.navigate("induccion") }
                }
            }
        }
    }
}

@Composable
fun DocumentsView(ssomaDocs: List<DocStatus>, rrhhDocs: List<DocStatus>, onDocClick: (DocStatus) -> Unit) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(20.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Card(
                colors = CardDefaults.cardColors(containerColor = Blue50),
                border = BorderStroke(1.dp, Blue100),
                shape = RoundedCornerShape(16.dp)
            ) {
                Row(Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                    Box(Modifier.size(40.dp).background(Color.White, CircleShape), contentAlignment = Alignment.Center) {
                        Icon(Icons.Outlined.Edit, null, tint = Blue600)
                    }
                    Spacer(Modifier.width(16.dp))
                    Column {
                        Text("Firmas Digitales", fontWeight = FontWeight.Bold, color = Slate900, fontSize = 16.sp)
                        Text("Aqui firmas los documentos habilitados por SSOMA y RRHH.", fontSize = 12.sp, color = Slate600)
                    }
                }
            }
        }
        item { SectionHeader("SSOMA - Seguridad", Blue600) }
        items(ssomaDocs) { doc -> DocItem(doc, onDocClick) }
        item { Spacer(Modifier.height(12.dp)); SectionHeader("Recursos Humanos", Purple600) }
        items(rrhhDocs) { doc -> DocItem(doc, onDocClick) }
    }
}

@Composable
fun UploadsView(adminUploads: List<AdminFileStatus>, onAdminFileClick: (AdminFileStatus) -> Unit) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(20.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Card(colors = CardDefaults.cardColors(containerColor = Amber50), border = BorderStroke(1.dp, Amber100), shape = RoundedCornerShape(16.dp)) {
                Row(Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                    Box(Modifier.size(40.dp).background(Color.White, CircleShape), contentAlignment = Alignment.Center) {
                        Icon(Icons.Default.CloudDownload, null, tint = Amber900)
                    }
                    Spacer(Modifier.width(16.dp))
                    Column {
                        Text("Legajo Digital", fontWeight = FontWeight.Bold, color = Amber900, fontSize = 16.sp)
                        Text("Documentos subidos por la administracion para tu carpeta SSOMA.", fontSize = 12.sp, color = Amber900.copy(alpha = 0.8f))
                    }
                }
            }
        }
        if (adminUploads.isEmpty()) {
            item { Text("No hay archivos subidos.", color = Slate500, fontSize = 14.sp) }
        } else {
            items(adminUploads) { file -> AdminFileItem(file, onAdminFileClick) }
        }
    }
}

@Composable
fun ProfileView(
    navController: NavController,
    userName: String,
    initial: String,
    userEmail: String,
    onEmailUpdated: (String) -> Unit
) {
    var showAccountSheet by remember { mutableStateOf(false) }
    var showHelpSheet by remember { mutableStateOf(false) }

    Column(Modifier.fillMaxSize().padding(24.dp), horizontalAlignment = Alignment.CenterHorizontally) {
        Spacer(Modifier.height(20.dp))
        Box(
            modifier = Modifier
                .size(110.dp)
                .background(Brush.linearGradient(listOf(Blue600, Blue700)), CircleShape)
                .border(4.dp, Color.White, CircleShape)
                .shadow(12.dp, CircleShape),
            contentAlignment = Alignment.Center
        ) {
            Text(initial, fontSize = 48.sp, fontWeight = FontWeight.Bold, color = Color.White)
        }
        Spacer(Modifier.height(24.dp))
        Text(userName, fontSize = 24.sp, fontWeight = FontWeight.ExtraBold, color = Slate900)
        Text(userEmail.ifBlank { "Sin correo registrado" }, fontSize = 13.sp, color = Slate500)

        Spacer(Modifier.height(40.dp))

        Card(modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = Color.White), elevation = CardDefaults.cardElevation(2.dp), shape = RoundedCornerShape(20.dp)) {
            Column(Modifier.padding(8.dp)) {
                ProfileOption(Icons.Outlined.Settings, "Configuracion de Cuenta") { showAccountSheet = true }
                HorizontalDivider(color = Slate50, thickness = 1.dp)
                ProfileOption(Icons.Outlined.HelpOutline, "Centro de Ayuda") { showHelpSheet = true }
            }
        }
    }

    if (showAccountSheet) {
        AccountSettingsSheet(
            currentEmail = userEmail,
            onEmailUpdated = onEmailUpdated,
            onDismiss = { showAccountSheet = false }
        )
    }

    if (showHelpSheet) {
        HelpCenterSheet(onDismiss = { showHelpSheet = false })
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AccountSettingsSheet(currentEmail: String, onEmailUpdated: (String) -> Unit, onDismiss: () -> Unit) {
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val sharedPrefs = remember(context) { context.getSharedPreferences("ruag_prefs", Context.MODE_PRIVATE) }

    var isBiometricEnabled by remember { mutableStateOf(sharedPrefs.getBoolean("biometric_enabled", false)) }
    var email by remember(currentEmail) { mutableStateOf(currentEmail) }
    var newPassword by remember { mutableStateOf("") }
    var confirmPassword by remember { mutableStateOf("") }
    var isSaving by remember { mutableStateOf(false) }

    fun syncSavedCredentials(updatedEmail: String, updatedPassword: String) {
        val savedIdentifier = sharedPrefs.getString("saved_identifier", "") ?: ""
        val savedPassword = sharedPrefs.getString("saved_password", "") ?: ""
        val editor = sharedPrefs.edit()
        if (savedIdentifier.equals(currentEmail, ignoreCase = true)) {
            editor.putString("saved_identifier", updatedEmail)
        }
        if (updatedPassword.isNotBlank() && savedPassword.isNotBlank()) {
            editor.putString("saved_password", updatedPassword)
        }
        editor.apply()
    }

    ModalBottomSheet(onDismissRequest = onDismiss, sheetState = sheetState, containerColor = Color.White) {
        Column(Modifier.fillMaxWidth().padding(24.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(Modifier.size(48.dp).background(Blue50, CircleShape), contentAlignment = Alignment.Center) {
                    Icon(Icons.Outlined.Settings, null, tint = Blue600)
                }
                Spacer(Modifier.width(16.dp))
                Column {
                    Text("Configuracion de Cuenta", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = Slate900)
                    Text("Actualiza tu correo, clave y acceso biometrico", fontSize = 13.sp, color = Slate500)
                }
            }

            Spacer(Modifier.height(32.dp))

            Row(Modifier.fillMaxWidth().background(Slate50, RoundedCornerShape(16.dp)).padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.Fingerprint, null, tint = Slate600, modifier = Modifier.size(28.dp))
                Spacer(Modifier.width(16.dp))
                Column(Modifier.weight(1f)) {
                    Text("Ingreso con Huella", fontWeight = FontWeight.Bold, color = Slate900, fontSize = 15.sp)
                    Text("Usa las credenciales guardadas para entrar mas rapido", color = Slate500, fontSize = 12.sp)
                }
                Switch(
                    checked = isBiometricEnabled,
                    onCheckedChange = { isChecked ->
                        isBiometricEnabled = isChecked
                        sharedPrefs.edit().putBoolean("biometric_enabled", isChecked).apply()
                        if (isChecked) {
                            Toast.makeText(context, "Huella activada. Asegurate de mantener tus credenciales actualizadas.", Toast.LENGTH_LONG).show()
                        }
                    },
                    colors = SwitchDefaults.colors(checkedThumbColor = Color.White, checkedTrackColor = Blue600, uncheckedThumbColor = Slate400, uncheckedTrackColor = Slate200)
                )
            }

            Spacer(Modifier.height(20.dp))

            OutlinedTextField(
                value = email,
                onValueChange = { email = it },
                modifier = Modifier.fillMaxWidth(),
                label = { Text("Correo electronico") },
                leadingIcon = { Icon(Icons.Outlined.Email, null) },
                singleLine = true,
                shape = RoundedCornerShape(16.dp)
            )

            Spacer(Modifier.height(16.dp))

            OutlinedTextField(
                value = newPassword,
                onValueChange = { newPassword = it },
                modifier = Modifier.fillMaxWidth(),
                label = { Text("Nueva contrasena") },
                leadingIcon = { Icon(Icons.Outlined.Lock, null) },
                singleLine = true,
                visualTransformation = PasswordVisualTransformation(),
                shape = RoundedCornerShape(16.dp)
            )

            Spacer(Modifier.height(16.dp))

            OutlinedTextField(
                value = confirmPassword,
                onValueChange = { confirmPassword = it },
                modifier = Modifier.fillMaxWidth(),
                label = { Text("Confirmar contrasena") },
                leadingIcon = { Icon(Icons.Outlined.Lock, null) },
                singleLine = true,
                visualTransformation = PasswordVisualTransformation(),
                shape = RoundedCornerShape(16.dp)
            )

            Spacer(Modifier.height(24.dp))

            Button(
                onClick = {
                    val cleanEmail = email.trim()
                    if (cleanEmail.isBlank()) {
                        Toast.makeText(context, "Ingresa un correo valido", Toast.LENGTH_SHORT).show()
                        return@Button
                    }
                    if (newPassword.isNotBlank() && newPassword.length < 6) {
                        Toast.makeText(context, "La contrasena debe tener al menos 6 caracteres", Toast.LENGTH_SHORT).show()
                        return@Button
                    }
                    if (newPassword != confirmPassword) {
                        Toast.makeText(context, "Las contrasenas no coinciden", Toast.LENGTH_SHORT).show()
                        return@Button
                    }
                    if (cleanEmail == currentEmail && newPassword.isBlank()) {
                        Toast.makeText(context, "No hay cambios para guardar", Toast.LENGTH_SHORT).show()
                        return@Button
                    }

                    scope.launch {
                        isSaving = true
                        try {
                            SupabaseClient.client.auth.updateUser {
                                if (cleanEmail != currentEmail) {
                                    this.email = cleanEmail
                                }
                                if (newPassword.isNotBlank()) {
                                    this.password = newPassword
                                }
                            }
                            syncSavedCredentials(cleanEmail, newPassword)
                            onEmailUpdated(cleanEmail)
                            Toast.makeText(context, "Credenciales actualizadas correctamente", Toast.LENGTH_LONG).show()
                            onDismiss()
                        } catch (e: Exception) {
                            Toast.makeText(context, "Error al actualizar: ${e.message}", Toast.LENGTH_LONG).show()
                        } finally {
                            isSaving = false
                        }
                    }
                },
                modifier = Modifier.fillMaxWidth().height(52.dp),
                shape = RoundedCornerShape(14.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Slate900)
            ) {
                if (isSaving) {
                    CircularProgressIndicator(color = Color.White, modifier = Modifier.size(20.dp))
                } else {
                    Text("Guardar Cambios", fontWeight = FontWeight.Bold)
                }
            }

            Spacer(Modifier.height(12.dp))

            OutlinedButton(
                onClick = onDismiss,
                modifier = Modifier.fillMaxWidth().height(52.dp),
                shape = RoundedCornerShape(14.dp)
            ) {
                Text("Cerrar", fontWeight = FontWeight.Bold)
            }

            Spacer(Modifier.height(24.dp))
        }
    }
}

// --- MODAL DEL CENTRO DE AYUDA ---
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HelpCenterSheet(onDismiss: () -> Unit) {
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    val context = LocalContext.current

    ModalBottomSheet(onDismissRequest = onDismiss, sheetState = sheetState, containerColor = Color.White) {
        Column(Modifier.fillMaxWidth().padding(24.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(Modifier.size(48.dp).background(Emerald50, CircleShape), contentAlignment = Alignment.Center) {
                    Icon(Icons.Outlined.HelpOutline, null, tint = Emerald600)
                }
                Spacer(Modifier.width(16.dp))
                Column {
                    Text("Centro de Ayuda", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = Slate900)
                    Text("Â¿Necesitas soporte tÃ©cnico?", fontSize = 13.sp, color = Slate500)
                }
            }

            Spacer(Modifier.height(32.dp))

            // Preguntas Frecuentes
            Row(Modifier.fillMaxWidth().clickable { Toast.makeText(context, "MÃ³dulo en construcciÃ³n", Toast.LENGTH_SHORT).show() }.background(Slate50, RoundedCornerShape(16.dp)).padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Outlined.QuestionAnswer, null, tint = Slate600, modifier = Modifier.size(24.dp))
                Spacer(Modifier.width(16.dp))
                Column(Modifier.weight(1f)) {
                    Text("Preguntas Frecuentes", fontWeight = FontWeight.Bold, color = Slate900, fontSize = 15.sp)
                    Text("Aprende a usar el portal", color = Slate500, fontSize = 12.sp)
                }
                Icon(Icons.Default.ChevronRight, null, tint = Slate400)
            }

            Spacer(Modifier.height(16.dp))

            // Soporte WhatsApp
            Row(Modifier.fillMaxWidth().clickable { Toast.makeText(context, "Abriendo WhatsApp...", Toast.LENGTH_SHORT).show() }.background(Emerald50, RoundedCornerShape(16.dp)).border(1.dp, Emerald100, RoundedCornerShape(16.dp)).padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Outlined.Chat, null, tint = Emerald600, modifier = Modifier.size(24.dp))
                Spacer(Modifier.width(16.dp))
                Column(Modifier.weight(1f)) {
                    Text("Soporte SSOMA Directo", fontWeight = FontWeight.Bold, color = Emerald600, fontSize = 15.sp)
                    Text("ContÃ¡ctanos vÃ­a WhatsApp", color = Emerald600.copy(0.7f), fontSize = 12.sp)
                }
            }

            Spacer(Modifier.height(32.dp))
            Button(onClick = onDismiss, modifier = Modifier.fillMaxWidth().height(50.dp), shape = RoundedCornerShape(12.dp), colors = ButtonDefaults.buttonColors(containerColor = Slate900)) {
                Text("Cerrar", fontWeight = FontWeight.Bold)
            }
            Spacer(Modifier.height(24.dp))
        }
    }
}

// --------------------------------------------------------
// COMPONENTES AUXILIARES UI
// --------------------------------------------------------

@Composable
fun SectionHeader(title: String, color: Color) {
    Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(bottom = 4.dp)) {
        Box(Modifier.size(4.dp, 18.dp).background(color, RoundedCornerShape(2.dp)))
        Spacer(Modifier.width(8.dp))
        Text(title, fontWeight = FontWeight.Bold, color = Slate900, fontSize = 15.sp)
    }
}

@Composable
fun ModernActionButton(modifier: Modifier = Modifier, label: String, subLabel: String, icon: ImageVector, iconColor: Color, bgColor: Color, onClick: () -> Unit) {
    Card(modifier = modifier.height(130.dp).clickable { onClick() }, colors = CardDefaults.cardColors(containerColor = Color.White), elevation = CardDefaults.cardElevation(4.dp), shape = RoundedCornerShape(24.dp)) {
        Column(Modifier.fillMaxSize().padding(20.dp), verticalArrangement = Arrangement.SpaceBetween, horizontalAlignment = Alignment.Start) {
            Box(Modifier.size(44.dp).clip(RoundedCornerShape(14.dp)).background(bgColor), contentAlignment = Alignment.Center) { Icon(icon, null, tint = iconColor, modifier = Modifier.size(24.dp)) }
            Column { Text(label, fontSize = 16.sp, fontWeight = FontWeight.Bold, color = Slate900); Text(subLabel, fontSize = 12.sp, color = Slate500) }
        }
    }
}

@Composable
fun DocItem(doc: DocStatus, onClick: (DocStatus) -> Unit) {
    val isUnlocked = doc.status == "unlocked"
    val isCompleted = doc.status == "completed"
    val color = if (doc.category == "rrhh") Purple600 else Blue600

    Card(modifier = Modifier.fillMaxWidth().clickable(enabled = isUnlocked) { onClick(doc) }, colors = CardDefaults.cardColors(containerColor = Color.White), elevation = CardDefaults.cardElevation(if(isUnlocked) 4.dp else 1.dp), shape = RoundedCornerShape(20.dp), border = if(isUnlocked) BorderStroke(1.dp, color.copy(0.3f)) else BorderStroke(1.dp, Slate100)) {
        Row(Modifier.padding(20.dp), verticalAlignment = Alignment.CenterVertically) {
            Box(Modifier.size(52.dp).background(if(isCompleted) Emerald50 else if(isUnlocked) color.copy(0.1f) else Slate50, RoundedCornerShape(16.dp)), contentAlignment = Alignment.Center) {
                Icon(if (isCompleted) Icons.Default.CheckCircle else if (isUnlocked) Icons.Default.Edit else Icons.Default.Lock, null, tint = if(isCompleted) Emerald600 else if(isUnlocked) color else Slate400, modifier = Modifier.size(24.dp))
            }
            Spacer(Modifier.width(16.dp))
            Column(Modifier.weight(1f)) {
                Text(doc.label, fontWeight = FontWeight.Bold, fontSize = 15.sp, color = if(doc.status=="locked") Slate400 else Slate900)
                Text(if (isCompleted) "Firmado y enviado" else if (isUnlocked) "Requiere tu firma" else "AÃºn no disponible", fontSize = 12.sp, color = if(isCompleted) Emerald600 else if(isUnlocked) color else Slate400, fontWeight = FontWeight.Medium)
            }
            if(isUnlocked) Icon(Icons.Default.ChevronRight, null, tint = Slate400)
        }
    }
}

@Composable
fun AdminFileItem(file: AdminFileStatus, onClick: (AdminFileStatus) -> Unit) {
    val isAvail = file.isAvailable
    Card(modifier = Modifier.fillMaxWidth().clickable(enabled = isAvail) { onClick(file) }, colors = CardDefaults.cardColors(containerColor = if(isAvail) Color.White else Slate50), shape = RoundedCornerShape(20.dp), border = BorderStroke(1.dp, if(isAvail) Emerald100 else Slate200), elevation = CardDefaults.cardElevation(if(isAvail) 2.dp else 0.dp)) {
        Row(Modifier.padding(20.dp), verticalAlignment = Alignment.CenterVertically) {
            Box(Modifier.size(48.dp).background(if(isAvail) Emerald50 else Slate100, CircleShape), contentAlignment = Alignment.Center) {
                Icon(if(isAvail) Icons.Outlined.FileDownload else Icons.Default.CloudOff, null, tint = if(isAvail) Emerald600 else Slate400, modifier = Modifier.size(24.dp))
            }
            Spacer(Modifier.width(16.dp))
            Column(Modifier.weight(1f)) {
                Text(file.label, fontWeight = FontWeight.Bold, fontSize = 15.sp, color = if(isAvail) Slate900 else Slate400)
                Text(if(isAvail) "Documento Disponible" else "Pendiente de carga", fontSize = 12.sp, fontWeight = FontWeight.Medium, color = if(isAvail) Emerald600 else Slate400)
            }
        }
    }
}

@Composable
fun ProfileOption(icon: ImageVector, label: String, onClick: () -> Unit) {
    Row(Modifier.fillMaxWidth().clickable { onClick() }.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
        Icon(icon, null, tint = Slate500)
        Spacer(Modifier.width(16.dp))
        Text(label, fontSize = 15.sp, color = Slate800, fontWeight = FontWeight.Bold)
        Spacer(Modifier.weight(1f))
        Icon(Icons.Default.ChevronRight, null, tint = Slate300)
    }
}

@Composable
fun DocumentModal(title: String, content: @Composable () -> Unit, onClose: () -> Unit, onConfirm: () -> Unit) {
    Dialog(onDismissRequest = onClose, properties = DialogProperties(usePlatformDefaultWidth = false)) {
        Box(Modifier.fillMaxSize().background(Slate900.copy(alpha = 0.8f))) {
            Card(modifier = Modifier.fillMaxWidth().fillMaxHeight(0.95f).align(Alignment.BottomCenter), shape = RoundedCornerShape(topStart = 32.dp, topEnd = 32.dp), colors = CardDefaults.cardColors(containerColor = Color.White)) {
                Column(Modifier.fillMaxSize()) {
                    Row(Modifier.fillMaxWidth().padding(24.dp), verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.SpaceBetween) {
                        Column(Modifier.weight(1f)) { Text("SSOMA DIGITAL", color = Blue600, fontSize = 11.sp, fontWeight = FontWeight.ExtraBold, letterSpacing = 1.sp); Text(title, fontSize = 22.sp, fontWeight = FontWeight.Bold, color = Slate900, maxLines = 1, overflow = TextOverflow.Ellipsis) }
                        IconButton(onClick = onClose, modifier = Modifier.background(Slate100, CircleShape)) { Icon(Icons.Default.Close, null, tint = Slate600) }
                    }
                    HorizontalDivider(color = Slate100)
                    Box(Modifier.weight(1f).background(Slate50)) { content() }
                    Column(Modifier.background(Color.White).shadow(elevation = 24.dp).padding(24.dp)) {
                        Row(Modifier.padding(bottom = 16.dp).background(Blue50, RoundedCornerShape(12.dp)).padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Outlined.Info, null, tint = Blue600, modifier = Modifier.size(20.dp))
                            Spacer(Modifier.width(12.dp))
                            Text("Declaro bajo juramento haber leÃ­do y comprendido el documento.", fontSize = 13.sp, color = Blue700, fontWeight = FontWeight.Medium)
                        }
                        Button(onClick = onConfirm, modifier = Modifier.fillMaxWidth().height(56.dp), shape = RoundedCornerShape(16.dp), colors = ButtonDefaults.buttonColors(containerColor = Slate900)) {
                            Icon(Icons.Outlined.Edit, null, modifier = Modifier.size(20.dp)); Spacer(Modifier.width(8.dp)); Text("FIRMAR DIGITALMENTE", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun MandatoryDownloadModal(item: MandatoryDownloadItem, queueCount: Int, onDownload: () -> Unit) {
    Dialog(
        onDismissRequest = {},
        properties = DialogProperties(usePlatformDefaultWidth = false, dismissOnBackPress = false, dismissOnClickOutside = false)
    ) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Slate900.copy(alpha = 0.82f))
                .padding(24.dp),
            contentAlignment = Alignment.Center
        ) {
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = Color.White),
                shape = RoundedCornerShape(28.dp)
            ) {
                Column(
                    modifier = Modifier.fillMaxWidth().padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Box(Modifier.size(72.dp).background(Blue50, CircleShape), contentAlignment = Alignment.Center) {
                        Icon(Icons.Outlined.FileDownload, null, tint = Blue600, modifier = Modifier.size(34.dp))
                    }
                    Spacer(Modifier.height(20.dp))
                    Text("Descarga obligatoria", fontSize = 22.sp, fontWeight = FontWeight.ExtraBold, color = Slate900)
                    Text(
                        "Debes abrir este documento antes de continuar con tus registros.",
                        fontSize = 13.sp,
                        color = Slate500,
                        textAlign = TextAlign.Center,
                        modifier = Modifier.padding(top = 8.dp)
                    )
                    Spacer(Modifier.height(20.dp))
                    Card(
                        colors = CardDefaults.cardColors(containerColor = Blue50),
                        border = BorderStroke(1.dp, Blue100),
                        shape = RoundedCornerShape(18.dp)
                    ) {
                        Column(Modifier.fillMaxWidth().padding(16.dp)) {
                            Text("Documento", fontSize = 11.sp, color = Blue600, fontWeight = FontWeight.ExtraBold, letterSpacing = 1.sp)
                            Spacer(Modifier.height(6.dp))
                            Text(item.label, fontSize = 16.sp, fontWeight = FontWeight.Bold, color = Slate900)
                            Text("Pendientes en cola: $queueCount", fontSize = 12.sp, color = Slate500, modifier = Modifier.padding(top = 4.dp))
                        }
                    }
                    Spacer(Modifier.height(20.dp))
                    Button(
                        onClick = onDownload,
                        modifier = Modifier.fillMaxWidth().height(54.dp),
                        shape = RoundedCornerShape(16.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = Slate900)
                    ) {
                        Icon(Icons.Outlined.OpenInNew, null, modifier = Modifier.size(20.dp))
                        Spacer(Modifier.width(8.dp))
                        Text("ABRIR DOCUMENTO", fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ChatBottomSheet(userId: String, messages: List<ChatMessage>, onSendMessage: (String) -> Unit, onDismiss: () -> Unit) {
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    var newMessage by remember { mutableStateOf("") }
    val listState = rememberLazyListState()
    LaunchedEffect(messages.size) { if (messages.isNotEmpty()) listState.animateScrollToItem(0) }
    ModalBottomSheet(onDismissRequest = onDismiss, sheetState = sheetState, containerColor = Color.White, dragHandle = { BottomSheetDefaults.DragHandle() }) {
        Column(Modifier.fillMaxSize().padding(horizontal = 16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp)) {
                Box(Modifier.size(50.dp).background(Blue50, CircleShape), contentAlignment = Alignment.Center) { Icon(Icons.Outlined.SupportAgent, null, tint = Blue600, modifier = Modifier.size(28.dp)) }
                Spacer(Modifier.width(16.dp))
                Column { Text("Soporte SSOMA", fontSize = 20.sp, fontWeight = FontWeight.Bold, color = Slate900); Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) { Box(Modifier.size(8.dp).background(Emerald500, CircleShape)); Text("En lÃ­nea", fontSize = 13.sp, color = Slate500, fontWeight = FontWeight.Medium) } }
            }
            HorizontalDivider(color = Slate100)
            LazyColumn(state = listState, modifier = Modifier.weight(1f).padding(vertical = 16.dp), verticalArrangement = Arrangement.spacedBy(16.dp), reverseLayout = true) {
                items(messages.reversed()) { msg ->
                    val isMe = msg.sender_id == userId
                    Column(modifier = Modifier.fillMaxWidth(), horizontalAlignment = if (isMe) Alignment.End else Alignment.Start) {
                        val alignShape = if (isMe) RoundedCornerShape(20.dp, 20.dp, 4.dp, 20.dp) else RoundedCornerShape(20.dp, 20.dp, 20.dp, 4.dp)
                        Box(modifier = Modifier.clip(alignShape).background(if (isMe) Blue600 else Slate100).padding(horizontal = 16.dp, vertical = 12.dp)) { Text(text = msg.content, color = if (isMe) Color.White else Slate900, fontSize = 15.sp) }
                        if (!isMe) Text("Soporte", fontSize = 11.sp, color = Slate400, modifier = Modifier.padding(start = 8.dp, top = 6.dp))
                    }
                }
            }
            Row(Modifier.padding(bottom = 24.dp).fillMaxWidth().background(Slate50, RoundedCornerShape(24.dp)).border(1.dp, Slate200, RoundedCornerShape(24.dp)).padding(6.dp), verticalAlignment = Alignment.CenterVertically) {
                BasicTextField(value = newMessage, onValueChange = { newMessage = it }, modifier = Modifier.weight(1f).padding(horizontal = 16.dp, vertical = 12.dp), textStyle = androidx.compose.ui.text.TextStyle(color = Slate900, fontSize = 16.sp), decorationBox = { innerTextField -> Box { if (newMessage.isEmpty()) Text("Escribe un mensaje...", color = Slate400); innerTextField() } })
                IconButton(onClick = { if (newMessage.isNotBlank()) { onSendMessage(newMessage); newMessage = "" } }, modifier = Modifier.size(44.dp).background(Blue600, CircleShape)) { Icon(Icons.Default.Send, null, tint = Color.White, modifier = Modifier.size(20.dp)) }
            }
        }
    }
}

// ... CONTENIDO DE DOCUMENTOS ...

@Composable
fun CargoPoliticaPrevencionLayout(ficha: JsonObject?) {
    // FunciÃ³n segura para extraer datos
    fun getStr(key: String): String {
        val element = ficha?.get(key)
        return if (element != null && element !is kotlinx.serialization.json.JsonNull) {
            element.jsonPrimitive.content
        } else ""
    }

    val nombres = getStr("nombres")
    val apellidoPaterno = getStr("apellido_paterno")
    val apellidoMaterno = getStr("apellido_materno")
    val fullName = listOf(nombres, apellidoPaterno, apellidoMaterno)
        .filter { it.isNotBlank() }
        .joinToString(" ")
        .uppercase()

    val dni = getStr("dni")
    val cargo = getStr("cargo").ifEmpty { "OPERARIO" }.uppercase()

    val firmaUrl = getStr("firma_url").ifEmpty { getStr("url_firma") }
    val huellaUrl = getStr("huella_url").ifEmpty { getStr("url_huella") }

    val today = LocalDate.now()
    val day = today.dayOfMonth.toString()
    val monthNames = arrayOf("enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre")
    val month = monthNames[today.monthValue - 1]
    val yearTwoDigits = (today.year % 100).toString()

    Column(
        Modifier
            .fillMaxSize()
            .background(Color.Black.copy(alpha = 0.03f))
            .padding(16.dp)
            .verticalScroll(rememberScrollState())
    ) {
        // --- HOJA BLANCA VERTICAL ---
        Column(
            Modifier
                .fillMaxWidth()
                .shadow(4.dp)
                .background(Color.White)
                .padding(32.dp)
        ) {
            // --- 1. ENCABEZADO ---
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(IntrinsicSize.Min)
                    .border(1.dp, Color.Black)
            ) {
                // Col 1: VersiÃ³n
                Box(
                    modifier = Modifier.weight(0.2f).fillMaxHeight().padding(4.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text("VersiÃ³n 01", fontWeight = FontWeight.Bold, color = Color.Black, fontSize = 10.sp)
                }

                Box(modifier = Modifier.width(1.dp).fillMaxHeight().background(Color.Black))

                // Col 2: TÃ­tulo Central
                Column(
                    modifier = Modifier.weight(0.55f).fillMaxHeight().padding(8.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    Text("POLÃTICA", fontWeight = FontWeight.Bold, color = Color.Black, fontSize = 10.sp, textAlign = TextAlign.Center)
                    Text("DE PREVENCIÃ“N Y SANCIÃ“N DEL\nHOSTIGAMIENTO SEXUAL LABORAL", fontWeight = FontWeight.Bold, color = Color.Black, fontSize = 12.sp, textAlign = TextAlign.Center)
                }

                Box(modifier = Modifier.width(1.dp).fillMaxHeight().background(Color.Black))

                // Col 3: Logo
                Box(
                    modifier = Modifier.weight(0.25f).fillMaxHeight().padding(4.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text("RUAG", fontWeight = FontWeight.Black, color = Color.Black, fontSize = 18.sp)
                }
            }

            Spacer(Modifier.height(48.dp))

            // --- 2. TÃTULO DEL DOCUMENTO ---
            Text(
                text = "CARGO",
                modifier = Modifier.fillMaxWidth(),
                textAlign = TextAlign.Center,
                fontWeight = FontWeight.Bold,
                fontSize = 16.sp,
                color = Color.Black
            )

            Spacer(Modifier.height(40.dp))

            // --- 3. CUERPO DEL TEXTO ---
            @OptIn(ExperimentalLayoutApi::class)
            FlowRow(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.Start,
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // PÃ¡rrafo 1
                Text("Yo", fontSize = 14.sp, color = Color.Black, modifier = Modifier.align(Alignment.Bottom))
                Spacer(Modifier.width(8.dp))
                SolidLineText(text = fullName, minWidth = 150.dp, modifier = Modifier.weight(1f).align(Alignment.Bottom))
                Spacer(Modifier.width(8.dp))
                Text(", identificado con DNI", fontSize = 14.sp, color = Color.Black, modifier = Modifier.align(Alignment.Bottom))
                Spacer(Modifier.width(8.dp))
                SolidLineText(text = dni, minWidth = 100.dp, modifier = Modifier.align(Alignment.Bottom))
                Text(",", fontSize = 14.sp, color = Color.Black, modifier = Modifier.align(Alignment.Bottom))
            }

            Spacer(Modifier.height(16.dp))

            @OptIn(ExperimentalLayoutApi::class)
            FlowRow(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.Start,
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // PÃ¡rrafo 2
                Text("colaborador de RUAG S.R.L., ocupando el cargo de", fontSize = 14.sp, color = Color.Black, modifier = Modifier.align(Alignment.Bottom))
                Spacer(Modifier.width(8.dp))
                SolidLineText(text = cargo, minWidth = 120.dp, modifier = Modifier.weight(1f).align(Alignment.Bottom))
                Text(", declaro lo siguiente:", fontSize = 14.sp, color = Color.Black, modifier = Modifier.align(Alignment.Bottom))
            }

            Spacer(Modifier.height(40.dp))

            // Lista de declaraciones
            Column(Modifier.padding(start = 24.dp, end = 8.dp), verticalArrangement = Arrangement.spacedBy(20.dp)) {
                Row(verticalAlignment = Alignment.Top) {
                    Text("1.", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = Color.Black, modifier = Modifier.width(24.dp))
                    Text("Haber recibido la PolÃ­tica de PrevenciÃ³n y SanciÃ³n del Hostigamiento Sexual Laboral.", fontSize = 14.sp, color = Color.Black, textAlign = TextAlign.Justify)
                }
                Row(verticalAlignment = Alignment.Top) {
                    Text("2.", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = Color.Black, modifier = Modifier.width(24.dp))
                    Text("Haber leÃ­do y entendido el contenido de la PolÃ­tica de PrevenciÃ³n y SanciÃ³n del Hostigamiento Sexual Laboral.", fontSize = 14.sp, color = Color.Black, textAlign = TextAlign.Justify)
                }
                Row(verticalAlignment = Alignment.Top) {
                    Text("3.", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = Color.Black, modifier = Modifier.width(24.dp))
                    Text("Encontrarme conforme con todos sus tÃ©rminos.", fontSize = 14.sp, color = Color.Black)
                }
            }

            Spacer(Modifier.height(64.dp))

            // --- 4. FECHA (CORREGIDA CON FLOWROW Y MAXLINES) ---
            @OptIn(ExperimentalLayoutApi::class)
            FlowRow(
                modifier = Modifier.padding(horizontal = 8.dp).fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(4.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text("Lima,", fontSize = 14.sp, color = Color.Black, maxLines = 1, softWrap = false, modifier = Modifier.align(Alignment.Bottom))
                SolidLineText(text = day, minWidth = 40.dp, modifier = Modifier.align(Alignment.Bottom))
                Text("de", fontSize = 14.sp, color = Color.Black, maxLines = 1, softWrap = false, modifier = Modifier.align(Alignment.Bottom))
                SolidLineText(text = month, minWidth = 80.dp, modifier = Modifier.align(Alignment.Bottom))
                Text("de 20", fontSize = 14.sp, color = Color.Black, maxLines = 1, softWrap = false, modifier = Modifier.align(Alignment.Bottom))
                SolidLineText(text = yearTwoDigits, minWidth = 40.dp, modifier = Modifier.align(Alignment.Bottom))
                Text(".", fontSize = 14.sp, color = Color.Black, maxLines = 1, softWrap = false, modifier = Modifier.align(Alignment.Bottom))
            }

            Spacer(Modifier.height(100.dp))

            // --- 5. FIRMA Y HUELLA ---
            Row(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Bottom
            ) {
                // Bloque de Firma
                Column(
                    modifier = Modifier.width(200.dp)
                ) {
                    Box(modifier = Modifier.height(70.dp).fillMaxWidth(), contentAlignment = Alignment.BottomCenter) {
                        if (firmaUrl.isNotEmpty()) {
                            AsyncImage(
                                model = firmaUrl,
                                contentDescription = "Firma",
                                modifier = Modifier.fillMaxSize().padding(bottom = 4.dp),
                                contentScale = ContentScale.Fit
                            )
                        }
                    }
                    Box(Modifier.fillMaxWidth().height(1.dp).background(Color.Black))
                    Text("Firma", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color.Black, modifier = Modifier.padding(top = 8.dp))
                    Text("Huella dactilar", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color.Black, modifier = Modifier.padding(top = 2.dp))
                }

                // Cuadro de Huella
                Box(
                    modifier = Modifier
                        .size(70.dp, 90.dp)
                        .border(1.dp, Color.Black, RoundedCornerShape(4.dp))
                        .padding(4.dp),
                    contentAlignment = Alignment.Center
                ) {
                    if (huellaUrl.isNotEmpty()) {
                        AsyncImage(
                            model = huellaUrl,
                            contentDescription = "Huella",
                            modifier = Modifier.fillMaxSize(),
                            contentScale = ContentScale.Fit
                        )
                    } else {
                        Text("Huella", fontSize = 10.sp, color = Color.Gray)
                    }
                }
            }
        }
    }
}

@Composable
fun CargoRitLayout(ficha: JsonObject?) {
    // FunciÃ³n segura para extraer datos
    fun getStr(key: String): String {
        val element = ficha?.get(key)
        return if (element != null && element !is kotlinx.serialization.json.JsonNull) {
            element.jsonPrimitive.content
        } else ""
    }

    val nombres = getStr("nombres")
    val apellidoPaterno = getStr("apellido_paterno")
    val apellidoMaterno = getStr("apellido_materno")
    val fullName = listOf(nombres, apellidoPaterno, apellidoMaterno)
        .filter { it.isNotBlank() }
        .joinToString(" ")
        .uppercase()

    val dni = getStr("dni")
    val cargo = getStr("cargo").ifEmpty { "OPERARIO" }

    val firmaUrl = getStr("firma_url").ifEmpty { getStr("url_firma") }
    val huellaUrl = getStr("huella_url").ifEmpty { getStr("url_huella") }

    val today = LocalDate.now()
    val day = today.dayOfMonth.toString()
    // Mes en espaÃ±ol
    val monthNames = arrayOf("enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre")
    val month = monthNames[today.monthValue - 1]
    val yearTwoDigits = (today.year % 100).toString()

    Column(
        Modifier
            .fillMaxSize()
            .background(Color.Black.copy(alpha = 0.03f))
            .padding(16.dp)
            .verticalScroll(rememberScrollState())
    ) {
        // --- HOJA BLANCA VERTICAL ---
        Column(
            Modifier
                .fillMaxWidth()
                .shadow(4.dp)
                .background(Color.White)
                .padding(32.dp)
        ) {
            // --- 1. ENCABEZADO ---
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(IntrinsicSize.Min)
                    .border(1.dp, Color.Black)
            ) {
                // Col 1: VersiÃ³n
                Box(
                    modifier = Modifier.weight(0.2f).fillMaxHeight().padding(4.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text("VersiÃ³n 01", fontWeight = FontWeight.Bold, color = Color.Black, fontSize = 10.sp)
                }

                Box(modifier = Modifier.width(1.dp).fillMaxHeight().background(Color.Black))

                // Col 2: TÃ­tulo Central
                Box(
                    modifier = Modifier.weight(0.55f).fillMaxHeight().padding(4.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text("REGLAMENTO INTERNO DE\nTRABAJO", fontWeight = FontWeight.Bold, color = Color.Black, fontSize = 12.sp, textAlign = TextAlign.Center)
                }

                Box(modifier = Modifier.width(1.dp).fillMaxHeight().background(Color.Black))

                // Col 3: Logo
                Box(
                    modifier = Modifier.weight(0.25f).fillMaxHeight().padding(4.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text("RUAG", fontWeight = FontWeight.Black, color = Color.Black, fontSize = 18.sp)
                }
            }

            Spacer(Modifier.height(48.dp))

            // --- 2. TÃTULO DEL DOCUMENTO ---
            Text(
                text = "CARGO",
                modifier = Modifier.fillMaxWidth(),
                textAlign = TextAlign.Center,
                fontWeight = FontWeight.Bold,
                fontSize = 16.sp,
                color = Color.Black
            )

            Spacer(Modifier.height(40.dp))

            // --- 3. CUERPO DEL TEXTO ---
            // Usamos FlowRow para intercalar texto normal con las variables en negrita
            @OptIn(ExperimentalLayoutApi::class)
            FlowRow(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 8.dp),
                horizontalArrangement = Arrangement.Start,
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text("Yo,", fontSize = 14.sp, color = Color.Black, modifier = Modifier.align(Alignment.Bottom))
                Spacer(Modifier.width(4.dp))
                Text(fullName, fontSize = 14.sp, fontWeight = FontWeight.Bold, color = Color.Black, modifier = Modifier.align(Alignment.Bottom))
                Text(",", fontSize = 14.sp, color = Color.Black, modifier = Modifier.align(Alignment.Bottom))
                Spacer(Modifier.width(4.dp))

                Text("identificado con DNI NÂ°", fontSize = 14.sp, color = Color.Black, modifier = Modifier.align(Alignment.Bottom))
                Spacer(Modifier.width(4.dp))
                Text(dni, fontSize = 14.sp, fontWeight = FontWeight.Bold, color = Color.Black, modifier = Modifier.align(Alignment.Bottom))
                Text(",", fontSize = 14.sp, color = Color.Black, modifier = Modifier.align(Alignment.Bottom))
                Spacer(Modifier.width(4.dp))

                Text("colaborador de RUAG S.R.L., ocupando el cargo de", fontSize = 14.sp, color = Color.Black, modifier = Modifier.align(Alignment.Bottom))
                Spacer(Modifier.width(4.dp))
                Text(cargo.uppercase(), fontSize = 14.sp, fontWeight = FontWeight.Bold, color = Color.Black, modifier = Modifier.align(Alignment.Bottom))
                Text(",", fontSize = 14.sp, color = Color.Black, modifier = Modifier.align(Alignment.Bottom))
                Spacer(Modifier.width(4.dp))

                Text("declaro lo siguiente:", fontSize = 14.sp, color = Color.Black, modifier = Modifier.align(Alignment.Bottom))
            }

            Spacer(Modifier.height(32.dp))

            // Lista de declaraciones
            Column(Modifier.padding(start = 24.dp, end = 8.dp), verticalArrangement = Arrangement.spacedBy(20.dp)) {
                Row(verticalAlignment = Alignment.Top) { // <-- CAMBIADO AQUÃ
                    Text("1.", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = Color.Black, modifier = Modifier.width(24.dp))
                    Text("Haber recibido el Reglamento Interno de Trabajo.", fontSize = 14.sp, color = Color.Black)
                }
                Row(verticalAlignment = Alignment.Top) { // <-- CAMBIADO AQUÃ
                    Text("2.", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = Color.Black, modifier = Modifier.width(24.dp))
                    Text("Haber leÃ­do y entendido el contenido del Reglamento Interno de Trabajo.", fontSize = 14.sp, color = Color.Black)
                }
                Row(verticalAlignment = Alignment.Top) { // <-- CAMBIADO AQUÃ
                    Text("3.", fontWeight = FontWeight.Bold, fontSize = 14.sp, color = Color.Black, modifier = Modifier.width(24.dp))
                    Text("Encontrarme conforme con todos sus tÃ©rminos.", fontSize = 14.sp, color = Color.Black)
                }
            }

            Spacer(Modifier.height(64.dp))

            // --- 4. FECHA (ARREGLADO CON FLOWROW) ---
            @OptIn(ExperimentalLayoutApi::class)
            FlowRow(
                modifier = Modifier.padding(horizontal = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(4.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text("Lima, ", fontSize = 14.sp, color = Color.Black, modifier = Modifier.align(Alignment.Bottom))
                DottedLineText(text = day, minWidth = 40.dp, modifier = Modifier.align(Alignment.Bottom))
                Text(" de ", fontSize = 14.sp, color = Color.Black, modifier = Modifier.align(Alignment.Bottom))
                DottedLineText(text = month, minWidth = 80.dp, modifier = Modifier.align(Alignment.Bottom))
                Text(" de 20", fontSize = 14.sp, color = Color.Black, modifier = Modifier.align(Alignment.Bottom))
                DottedLineText(text = yearTwoDigits, minWidth = 40.dp, modifier = Modifier.align(Alignment.Bottom))
                Text(".", fontSize = 14.sp, color = Color.Black, modifier = Modifier.align(Alignment.Bottom))
            }

            Spacer(Modifier.height(100.dp))

            // --- 5. FIRMA Y HUELLA ---
            Box(modifier = Modifier.fillMaxWidth().height(120.dp)) {
                // Bloque de Firma (Centrado)
                Column(
                    modifier = Modifier.align(Alignment.BottomCenter).width(200.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Box(modifier = Modifier.height(70.dp).fillMaxWidth(), contentAlignment = Alignment.BottomCenter) {
                        if (firmaUrl.isNotEmpty()) {
                            AsyncImage(
                                model = firmaUrl,
                                contentDescription = "Firma",
                                modifier = Modifier.fillMaxSize().padding(bottom = 4.dp),
                                contentScale = ContentScale.Fit
                            )
                        }
                    }
                    Box(Modifier.fillMaxWidth().height(1.dp).background(Color.Black))
                    Text("Firma y Huella dactilar", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color.Black, modifier = Modifier.padding(top = 8.dp))
                }

                // Cuadro de Huella (A la derecha)
                Box(
                    modifier = Modifier
                        .align(Alignment.BottomEnd)
                        .padding(end = 16.dp)
                        .size(70.dp, 90.dp)
                        .border(1.dp, Color.Black, RoundedCornerShape(4.dp))
                        .padding(4.dp),
                    contentAlignment = Alignment.Center
                ) {
                    if (huellaUrl.isNotEmpty()) {
                        AsyncImage(
                            model = huellaUrl,
                            contentDescription = "Huella",
                            modifier = Modifier.fillMaxSize(),
                            contentScale = ContentScale.Fit
                        )
                    } else {
                        Text("Huella", fontSize = 10.sp, color = Color.Gray)
                    }
                }
            }
        }
    }
}

@Composable
fun ActaEntregaIpercLayout(ficha: JsonObject?) {
    // FunciÃ³n segura para extraer datos
    fun getStr(key: String): String {
        val element = ficha?.get(key)
        return if (element != null && element !is kotlinx.serialization.json.JsonNull) {
            element.jsonPrimitive.content
        } else ""
    }

    val nombres = getStr("nombres")
    val apellidoPaterno = getStr("apellido_paterno")
    val apellidoMaterno = getStr("apellido_materno")
    val fullName = listOf(nombres, apellidoPaterno, apellidoMaterno)
        .filter { it.isNotBlank() }
        .joinToString(" ")
        .uppercase()

    val dni = getStr("dni")
    val cargo = getStr("cargo").ifEmpty { "OPERARIO" }
    val firmaUrl = getStr("firma_url").ifEmpty { getStr("url_firma") }
    val nombreObra = getStr("nombre_obra").ifEmpty { "OBRA CENTRAL" }
    val today = LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))

    Column(
        Modifier
            .fillMaxSize()
            .background(Color.Black.copy(alpha = 0.03f))
            .padding(16.dp)
            .verticalScroll(rememberScrollState())
    ) {
        // --- HOJA BLANCA ---
        Column(
            Modifier
                .fillMaxWidth()
                .shadow(4.dp)
                .background(Color.White)
                .padding(24.dp)
        ) {
            // --- 1. ENCABEZADO ---
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(IntrinsicSize.Min)
                    .border(1.dp, Color.Black)
            ) {
                // Logo
                Box(modifier = Modifier.weight(0.20f).fillMaxHeight().padding(4.dp), contentAlignment = Alignment.Center) {
                    Text("RUAG", fontWeight = FontWeight.Black, color = Color.Black, fontSize = 16.sp)
                }
                Box(modifier = Modifier.width(1.dp).fillMaxHeight().background(Color.Black))

                // TÃ­tulo
                Column(modifier = Modifier.weight(0.60f).fillMaxHeight().padding(4.dp), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
                    Text("ACTA DE ENTREGA DE IPERC", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = Color.Black, textAlign = TextAlign.Center)
                    Spacer(Modifier.height(4.dp))
                    Text("POR PUESTO DE TRABAJO", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = Color.Black, textAlign = TextAlign.Center)
                }
                Box(modifier = Modifier.width(1.dp).fillMaxHeight().background(Color.Black))

                // Detalles
                Column(modifier = Modifier.weight(0.20f).fillMaxHeight()) {
                    Row(Modifier.weight(1f).fillMaxWidth().border(0.5.dp, Color.Black).padding(4.dp), verticalAlignment = Alignment.CenterVertically) {
                        Text("CÃ“DIGO:", fontSize = 8.sp, fontWeight = FontWeight.Bold, color = Color.Black, modifier = Modifier.weight(1f))
                        Text("SG-FOR-112", fontSize = 8.sp, color = Color.Black)
                    }
                    Row(Modifier.weight(1f).fillMaxWidth().border(0.5.dp, Color.Black).padding(4.dp), verticalAlignment = Alignment.CenterVertically) {
                        Text("REVISIÃ“N:", fontSize = 8.sp, fontWeight = FontWeight.Bold, color = Color.Black, modifier = Modifier.weight(1f))
                        Text("01", fontSize = 8.sp, color = Color.Black)
                    }
                    Row(Modifier.weight(1f).fillMaxWidth().border(0.5.dp, Color.Black).padding(4.dp), verticalAlignment = Alignment.CenterVertically) {
                        Text("FECHA:", fontSize = 8.sp, fontWeight = FontWeight.Bold, color = Color.Black, modifier = Modifier.weight(1f))
                        Text("1/08/2024", fontSize = 8.sp, color = Color.Black)
                    }
                    Row(Modifier.weight(1f).fillMaxWidth().border(0.5.dp, Color.Black).padding(4.dp), verticalAlignment = Alignment.CenterVertically) {
                        Text("PÃGINA:", fontSize = 8.sp, fontWeight = FontWeight.Bold, color = Color.Black, modifier = Modifier.weight(1f))
                        Text("01 / 01", fontSize = 8.sp, color = Color.Black)
                    }
                }
            }

            Spacer(Modifier.height(40.dp))

            // --- 2. CUERPO DEL TEXTO ---

            // PÃ¡rrafo 1 (Intercalando texto con lÃ­neas de campos)
            // Usamos un componente personalizado de Flujo (FlowRow) que simula texto en lÃ­nea.
            @OptIn(ExperimentalLayoutApi::class)
            FlowRow(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.Start,
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text("Yo,", fontSize = 12.sp, color = Color.Black, modifier = Modifier.align(Alignment.Bottom))
                Spacer(Modifier.width(4.dp))
                DottedLineText(text = fullName, minWidth = 200.dp, modifier = Modifier.align(Alignment.Bottom))
                Spacer(Modifier.width(4.dp))

                Text(", identificado con DNI/CE/Pasaporte NÂº", fontSize = 12.sp, color = Color.Black, modifier = Modifier.align(Alignment.Bottom))
                Spacer(Modifier.width(4.dp))
                DottedLineText(text = dni, minWidth = 80.dp, modifier = Modifier.align(Alignment.Bottom))
                Spacer(Modifier.width(4.dp))

                Text(", desempeÃ±o el cargo de", fontSize = 12.sp, color = Color.Black, modifier = Modifier.align(Alignment.Bottom))
                Spacer(Modifier.width(4.dp))
                DottedLineText(text = cargo, minWidth = 100.dp, modifier = Modifier.align(Alignment.Bottom))
                Spacer(Modifier.width(4.dp))

                Text("en la empresa", fontSize = 12.sp, color = Color.Black, modifier = Modifier.align(Alignment.Bottom))
                Spacer(Modifier.width(4.dp))
                DottedLineText(text = "RUAG S.R.L.", minWidth = 80.dp, modifier = Modifier.align(Alignment.Bottom))
                Spacer(Modifier.width(4.dp))

                Text("para el proyecto", fontSize = 12.sp, color = Color.Black, modifier = Modifier.align(Alignment.Bottom))
                Spacer(Modifier.width(4.dp))
                DottedLineText(text = nombreObra, minWidth = 150.dp, modifier = Modifier.align(Alignment.Bottom))
                Text(".", fontSize = 12.sp, color = Color.Black, modifier = Modifier.align(Alignment.Bottom))
            }

            Spacer(Modifier.height(20.dp))

            Text(
                "Por medio de la presente declaro haber recibido copia de la Matriz de IdentificaciÃ³n de Peligros, EvaluaciÃ³n de Riesgos y Controles (IPERC) de mi puesto de trabajo de parte de RUAG S.R.L.",
                fontSize = 12.sp, color = Color.Black, textAlign = TextAlign.Justify, lineHeight = 18.sp
            )

            Spacer(Modifier.height(20.dp))

            Text(
                "A su vez declaro mi compromiso en leerla, y acatar responsablemente las medidas de control descritas en la misma.",
                fontSize = 12.sp, color = Color.Black, textAlign = TextAlign.Justify, lineHeight = 18.sp
            )

            Spacer(Modifier.height(20.dp))

            Text(
                "En conformidad con lo mencionado y recepciÃ³n,",
                fontSize = 12.sp, color = Color.Black
            )

            Spacer(Modifier.height(80.dp))

            // --- 3. SECCIÃ“N DE FIRMA ---
            Column(Modifier.padding(start = 32.dp)) {
                // Firma
                Row(verticalAlignment = Alignment.Bottom, modifier = Modifier.padding(bottom = 24.dp)) {
                    Text("FIRMA:", fontWeight = FontWeight.Bold, fontSize = 12.sp, color = Color.Black, modifier = Modifier.width(60.dp))
                    Box(modifier = Modifier.width(200.dp).height(50.dp), contentAlignment = Alignment.BottomCenter) {
                        if (firmaUrl.isNotEmpty()) {
                            AsyncImage(
                                model = firmaUrl,
                                contentDescription = "Firma",
                                modifier = Modifier.fillMaxSize().padding(bottom = 2.dp),
                                contentScale = ContentScale.Fit
                            )
                        }
                        Box(Modifier.fillMaxWidth().height(1.dp).background(Color.Black))
                    }
                }

                // DNI
                Row(verticalAlignment = Alignment.Bottom, modifier = Modifier.padding(bottom = 24.dp)) {
                    Text("DNI:", fontWeight = FontWeight.Bold, fontSize = 12.sp, color = Color.Black, modifier = Modifier.width(60.dp))
                    Box(modifier = Modifier.width(200.dp), contentAlignment = Alignment.Center) {
                        Text(dni, fontWeight = FontWeight.Bold, fontSize = 12.sp, color = Color.Black, modifier = Modifier.padding(bottom = 4.dp))
                        Box(Modifier.fillMaxWidth().height(1.dp).background(Color.Black).align(Alignment.BottomCenter))
                    }
                }

                // FECHA
                Row(verticalAlignment = Alignment.Bottom) {
                    Text("FECHA:", fontWeight = FontWeight.Bold, fontSize = 12.sp, color = Color.Black, modifier = Modifier.width(60.dp))
                    Box(modifier = Modifier.width(200.dp), contentAlignment = Alignment.Center) {
                        Text(today, fontWeight = FontWeight.Bold, fontSize = 12.sp, color = Color.Black, modifier = Modifier.padding(bottom = 4.dp))
                        Box(Modifier.fillMaxWidth().height(1.dp).background(Color.Black).align(Alignment.BottomCenter))
                    }
                }
            }
        }
    }
}

@Composable
fun ActaDerechoSaberLayout(ficha: JsonObject?) {
    // FunciÃ³n segura para extraer datos
    fun getStr(key: String): String {
        val element = ficha?.get(key)
        return if (element != null && element !is kotlinx.serialization.json.JsonNull) {
            element.jsonPrimitive.content
        } else ""
    }

    val nombres = getStr("nombres")
    val apellidoPaterno = getStr("apellido_paterno")
    val apellidoMaterno = getStr("apellido_materno")
    val fullName = listOf(apellidoPaterno, apellidoMaterno, nombres)
        .filter { it.isNotBlank() }
        .joinToString(", ")
        .uppercase()

    val dni = getStr("dni")
    val cargo = getStr("cargo").ifEmpty { "OPERARIO" }
    val firmaUrl = getStr("firma_url").ifEmpty { getStr("url_firma") }
    val nombreObra = getStr("nombre_obra").ifEmpty { "OBRA CENTRAL" }

    val today = LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))

    // Extraer datos de los checks (Si existen en el JSON)
    val docData = ficha?.get("doc_states")?.jsonObject?.get("acta_derecho")?.jsonObject?.get("data")?.jsonObject

    val risks = listOf(
        "Ley de Accidentes del trabajo y Enfermedades profesionales; Ley 29783; RM 480-2008-SA",
        "Reglamento Interno de Seguridad.",
        "PolÃ­ticas de Seguridad y Salud Ocupacional y Medio Ambiente.",
        "OrganizaciÃ³n del sistema de gestiÃ³n de la seguridad y salud en el trabajo en la obra.",
        "Derechos y obligaciones de los/las trabajadores/as y supervisores/as.",
        "Conceptos bÃ¡sicos de seguridad y salud en el trabajo.",
        "Reglas de trÃ¡nsito (de ser aplicable a la obra).",
        "Conceptos bÃ¡sicos de seguridad y salud en el trabajo (Repaso).",
        "Plan de Seguridad y Salud Ocupacional, Plan de PrevenciÃ³n Ambiental",
        "Reconocimiento del Ã¡rea de trabajo.",
        "Elementos de protecciÃ³n personal, tipos requeridos, manejo correcto, Obligatoriedad y protecciones colectivas.",
        "Control de Emergencias, Incendios, Uso de Extintores, Primeros Auxilios, AtenciÃ³n de lesionados.",
        "Procedimiento Trabajo en Altura, Procedimientos de Trabajo Seguro, uso correcto de arnÃ©s de seguridad.",
        "Superficies de Trabajo; andamios, escaleras, plataformas, elevadores de personas, etc.",
        "Manejo de materiales; maniobras, trabajo con equipos de levante (Tirford, tecles, estrobos, etc.).",
        "Riesgos elÃ©ctricos, equipos energizados.",
        "Esmeril angular; uso seguro.",
        "Oxicorte; uso, riesgos y medidas preventivas.",
        "Cilindros de Gases Comprimidos; manejo, almacenamiento y transporte.",
        "Trabajos de soldadura.",
        "Excavaciones, Entibaciones, Fortificaciones y Taludes.",
        "Vaciado de Concreto.",
        "Housekeeping (Orden y Aseo).",
        "CÃ³digo de colores y seÃ±alizaciÃ³n.",
        "ExposiciÃ³n a Ruidos, polvo y vibraciones.",
        "Desplazamientos por Ã¡reas de trabajo.",
        "Higiene Personal, Recomendaciones.",
        "Control, Manejo, uso y transporte de sustancias peligrosas.",
        "Sistemas de bloqueos y uso de Tarjeta de Seguridad.",
        "Procedimiento Operacional de Equipos, Maquinarias y Herramientas, uso de canastillo.",
        "Combustibles; Manejo, Almacenamiento y Transporte.",
        "Cambio de conducta, Autocuidado, Reconocimiento, Sanciones, Contacto Personal.",
        "ProhibiciÃ³n de ingreso al Proyecto bajo la influencia de alcohol y/o drogas.",
        "IdentificaciÃ³n de Aspectos e Impactos Ambientales.",
        "Sobre Riesgos Ambientales, Manejo de residuos.",
        "Equipos Radioactivos.",
        "PreparaciÃ³n y respuesta ante emergencias.",
        "Trabajos de alto riesgo."
    )

    // Agregamos "RowScope." aquÃ­ ðŸ‘‡
    @Composable
    fun RowScope.TableCell(
        modifier: Modifier = Modifier,
        weight: Float? = null,
        border: Boolean = true,
        bgColor: Color = Color.Transparent,
        contentAlignment: Alignment = Alignment.CenterStart,
        content: @Composable BoxScope.() -> Unit
    ) {
        Box(
            modifier = modifier
                .then(if (weight != null) Modifier.weight(weight) else Modifier)
                .fillMaxHeight()
                .then(if (border) Modifier.border(0.5.dp, Color.Black) else Modifier)
                .background(bgColor)
                .padding(horizontal = 4.dp, vertical = 2.dp),
            contentAlignment = contentAlignment,
            content = content
        )
    }

    Column(
        Modifier
            .fillMaxSize()
            .background(Color.Black.copy(alpha = 0.03f))
            .padding(16.dp)
            .verticalScroll(rememberScrollState())
    ) {
        // --- HOJA BLANCA ---
        Column(
            Modifier
                .fillMaxWidth()
                .shadow(4.dp)
                .background(Color.White)
                .padding(24.dp)
        ) {
            // --- 1. HEADER ---
            Column(Modifier.fillMaxWidth().border(1.dp, Color.Black)) {
                Row(Modifier.fillMaxWidth().height(IntrinsicSize.Min)) {
                    // Logo (RowSpan simulated by filling height)
                    Box(modifier = Modifier.weight(0.18f).fillMaxHeight().border(0.5.dp, Color.Black).padding(2.dp), contentAlignment = Alignment.Center) {
                        Text("RUAG", fontWeight = FontWeight.Black, color = Color.Black, fontSize = 16.sp)
                    }
                    // Titulos Centrales
                    Column(Modifier.weight(0.6f)) {
                        Box(Modifier.fillMaxWidth().weight(1f).border(0.5.dp, Color.Black).background(Color(0xFFD9D9D9)).padding(4.dp), contentAlignment = Alignment.Center) {
                            Text("SEGURIDAD, SALUD OCUPACIONAL Y MEDIO AMBIENTE", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = Color.Black, textAlign = TextAlign.Center)
                        }
                        Box(Modifier.fillMaxWidth().weight(2f).border(0.5.dp, Color.Black).background(Color(0xFFD9D9D9)).padding(4.dp), contentAlignment = Alignment.Center) {
                            Text("ACTA DE DERECHO A SABER", fontSize = 14.sp, fontWeight = FontWeight.Bold, color = Color.Black, textAlign = TextAlign.Center)
                        }
                    }
                    // Meta (Codigo, Revision, Fecha)
                    Column(Modifier.weight(0.22f)) {
                        Row(Modifier.weight(1f)) {
                            TableCell(weight = 0.4f, bgColor = Color(0xFFF2F2F2)) { Text("CÃ³digo", fontSize = 8.sp, fontWeight = FontWeight.Bold, color = Color.Black) }
                            TableCell(weight = 0.6f, contentAlignment = Alignment.Center) { Text("SG-FOR-110", fontSize = 8.sp, color = Color.Black) }
                        }
                        Row(Modifier.weight(1f)) {
                            TableCell(weight = 0.4f, bgColor = Color(0xFFF2F2F2)) { Text("RevisiÃ³n", fontSize = 8.sp, fontWeight = FontWeight.Bold, color = Color.Black) }
                            TableCell(weight = 0.6f, contentAlignment = Alignment.Center) { Text("0", fontSize = 8.sp, color = Color.Black) }
                        }
                        Row(Modifier.weight(1f)) {
                            TableCell(weight = 0.4f, bgColor = Color(0xFFF2F2F2)) { Text("Fecha", fontSize = 8.sp, fontWeight = FontWeight.Bold, color = Color.Black) }
                            TableCell(weight = 0.6f, contentAlignment = Alignment.Center) { Text("01/08/2024", fontSize = 8.sp, color = Color.Black) }
                        }
                    }
                }
            }

            Spacer(Modifier.height(8.dp))

            // --- 2. DATOS DEL TRABAJADOR Y FIRMA ---
            Column(Modifier.fillMaxWidth().border(1.dp, Color.Black)) {
                Row(Modifier.fillMaxWidth().height(IntrinsicSize.Min)) {
                    TableCell(weight = 0.35f, bgColor = Color(0xFFF2F2F2)) { Text("OBRA:", fontSize = 8.sp, fontWeight = FontWeight.Bold, color = Color.Black) }
                    TableCell(weight = 0.65f) { Text(nombreObra, fontSize = 8.sp, color = Color.Black) }
                }
                Row(Modifier.fillMaxWidth().height(IntrinsicSize.Min)) {
                    TableCell(weight = 0.35f, bgColor = Color(0xFFF2F2F2)) { Text("EMPRESA:", fontSize = 8.sp, fontWeight = FontWeight.Bold, color = Color.Black) }
                    TableCell(weight = 0.65f) { Text("RUAG S.R.L.", fontSize = 8.sp, color = Color.Black) }
                }
                Row(Modifier.fillMaxWidth().height(IntrinsicSize.Min)) {
                    TableCell(weight = 0.35f, bgColor = Color(0xFFF2F2F2)) { Text("NOMBRE DEL TRABAJADOR:", fontSize = 8.sp, fontWeight = FontWeight.Bold, color = Color.Black) }
                    TableCell(weight = 0.65f) { Text(fullName, fontSize = 8.sp, color = Color.Black) }
                }
                Row(Modifier.fillMaxWidth().height(IntrinsicSize.Min)) {
                    TableCell(weight = 0.35f, bgColor = Color(0xFFF2F2F2)) { Text("DNI:", fontSize = 8.sp, fontWeight = FontWeight.Bold, color = Color.Black) }
                    TableCell(weight = 0.65f) { Text(dni, fontSize = 8.sp, color = Color.Black) }
                }

                // Bloque complejo: Especialidad a la izquierda (con mÃ¡s filas debajo) y Firma a la derecha ocupando el resto del alto
                Row(Modifier.fillMaxWidth().height(IntrinsicSize.Min)) {
                    Column(Modifier.weight(0.65f)) {
                        Row(Modifier.fillMaxWidth().height(IntrinsicSize.Min)) {
                            TableCell(weight = 0.54f, bgColor = Color(0xFFF2F2F2)) { Text("ESPECIALIDAD:", fontSize = 8.sp, fontWeight = FontWeight.Bold, color = Color.Black) }
                            TableCell(weight = 0.46f) { Text(cargo, fontSize = 8.sp, color = Color.Black) }
                        }
                        Row(Modifier.fillMaxWidth().height(IntrinsicSize.Min)) {
                            TableCell(weight = 0.54f, bgColor = Color(0xFFF2F2F2)) { Text("CATEGORIA:", fontSize = 8.sp, fontWeight = FontWeight.Bold, color = Color.Black) }
                            TableCell(weight = 0.46f) { Text("OPERARIO", fontSize = 8.sp, color = Color.Black) }
                        }
                        Row(Modifier.fillMaxWidth().height(IntrinsicSize.Min)) {
                            TableCell(weight = 0.54f, bgColor = Color(0xFFF2F2F2)) { Text("FECHA:", fontSize = 8.sp, fontWeight = FontWeight.Bold, color = Color.Black) }
                            TableCell(weight = 0.46f) { Text(today, fontSize = 8.sp, color = Color.Black) }
                        }
                        Row(Modifier.fillMaxWidth().height(IntrinsicSize.Min)) {
                            TableCell(weight = 0.54f, bgColor = Color(0xFFF2F2F2)) { Text("DURACIÃ“N DE LA CHARLA:", fontSize = 8.sp, fontWeight = FontWeight.Bold, color = Color.Black) }
                            TableCell(weight = 0.46f) { Text("1.5 Hrs.", fontSize = 8.sp, color = Color.Black) }
                        }
                    }
                    // Celda de Firma
                    Box(modifier = Modifier.weight(0.35f).fillMaxHeight().border(0.5.dp, Color.Black).padding(4.dp), contentAlignment = Alignment.BottomCenter) {
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Box(modifier = Modifier.height(60.dp).fillMaxWidth(), contentAlignment = Alignment.BottomCenter) {
                                if (firmaUrl.isNotEmpty()) {
                                    AsyncImage(
                                        model = firmaUrl,
                                        contentDescription = "Firma",
                                        modifier = Modifier.fillMaxSize().padding(bottom = 2.dp),
                                        contentScale = ContentScale.Fit
                                    )
                                }
                            }
                            Box(Modifier.fillMaxWidth(0.8f).height(1.dp).background(Color.Black))
                            Text("FIRMA DEL TRABAJADOR", fontSize = 7.sp, fontWeight = FontWeight.Bold, color = Color.Black, modifier = Modifier.padding(top = 2.dp))
                        }
                    }
                }
            }

            Spacer(Modifier.height(8.dp))

            // --- 3. CUERPO DEL ACTA (Lista de items) ---
            Column(Modifier.fillMaxWidth().border(1.dp, Color.Black)) {
                Box(Modifier.fillMaxWidth().background(Color(0xFFD9D9D9)).border(0.5.dp, Color.Black).padding(4.dp), contentAlignment = Alignment.Center) {
                    Text("ACTA DERECHO A SABER", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Color.Black)
                }
                Column(Modifier.padding(8.dp)) {
                    Text(
                        "A travÃ©s de esta acta declaro haber sido informado acerca de todos los riesgos que entraÃ±an las labores que desarrollarÃ© en mi trabajo, asÃ­ como las medidas preventivas que debo tomar para hacer de esto un mÃ©todo seguro de trabajo, ademÃ¡s aquellos aspectos ambientales que tengan relaciÃ³n con mi puesto y Ã¡rea de trabajo.",
                        fontSize = 9.sp, color = Color.Black, textAlign = TextAlign.Justify, lineHeight = 12.sp, modifier = Modifier.padding(bottom = 8.dp)
                    )

                    risks.forEachIndexed { index, risk ->
                        val isChecked = docData?.get("topic_$index")?.jsonPrimitive?.boolean ?: false
                        Row(Modifier.fillMaxWidth().padding(bottom = 3.dp), verticalAlignment = Alignment.Top) {
                            Box(modifier = Modifier.size(10.dp).border(1.dp, Color.Black).padding(top = 0.5.dp), contentAlignment = Alignment.Center) {
                                if (isChecked) Text("X", fontSize = 8.sp, fontWeight = FontWeight.Bold, color = Color.Black)
                            }
                            Spacer(Modifier.width(6.dp))
                            Text("${index + 1}.- ", fontSize = 8.sp, fontWeight = FontWeight.Bold, color = Color.Black)
                            Text(risk, fontSize = 8.sp, color = Color.Black, lineHeight = 10.sp)
                        }
                    }
                }
            }

            Spacer(Modifier.height(8.dp))

            // --- 4. FOOTER (EXPOSITOR) ---
            Column(Modifier.fillMaxWidth().border(1.dp, Color.Black)) {
                Box(Modifier.fillMaxWidth().background(Color(0xFFD9D9D9)).border(0.5.dp, Color.Black).padding(4.dp), contentAlignment = Alignment.Center) {
                    Text("EXPOSITOR (SSOMA)", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = Color.Black)
                }
                Row(Modifier.fillMaxWidth().height(20.dp)) {
                    TableCell(weight = 0.3f, bgColor = Color(0xFFF2F2F2)) { Text("NOMBRE", fontSize = 8.sp, fontWeight = FontWeight.Bold, color = Color.Black) }
                    TableCell(weight = 0.7f) { }
                }
                Row(Modifier.fillMaxWidth().height(20.dp)) {
                    TableCell(weight = 0.3f, bgColor = Color(0xFFF2F2F2)) { Text("CARGO", fontSize = 8.sp, fontWeight = FontWeight.Bold, color = Color.Black) }
                    TableCell(weight = 0.7f) { }
                }
                Row(Modifier.fillMaxWidth().height(45.dp)) {
                    TableCell(weight = 0.3f, bgColor = Color(0xFFF2F2F2)) { Text("FIRMA", fontSize = 8.sp, fontWeight = FontWeight.Bold, color = Color.Black) }
                    TableCell(weight = 0.7f) { }
                }
            }
        }
    }
}

@Composable
fun EntregaEppLayout(ficha: JsonObject?) {
    // FunciÃ³n segura para extraer datos
    fun getStr(key: String): String {
        val element = ficha?.get(key)
        return if (element != null && element !is kotlinx.serialization.json.JsonNull) {
            element.jsonPrimitive.content
        } else ""
    }

    val nombres = getStr("nombres")
    val apellidoPaterno = getStr("apellido_paterno")
    val apellidoMaterno = getStr("apellido_materno")
    val fullName = listOf(apellidoPaterno, apellidoMaterno, nombres)
        .filter { it.isNotBlank() }
        .joinToString(", ")
        .uppercase()

    val dni = getStr("dni")
    val cargo = getStr("cargo").ifEmpty { "OPERARIO" }
    val nombreObra = getStr("nombre_obra").ifEmpty { "OBRA CENTRAL" }

    val epps = listOf(
        "BARBIQUEJO", "BOTAS CON PUNTA DE ACERO", "CASCO DE SEGURIDAD", "POLO",
        "CHALECO REFLEXIVO DE SEGURIDAD", "LENTES CLAROS DE SEGURIDAD", "LENTES OSCUROS",
        "TAPONES AUDITIVOS", "GUANTES ANTICORTE NIVEL 5", "GUANTES DE CUERO",
        "GUANTES DE JEBE", "GUANTES PARA SOLDAR", "CARETA O PROTECTOR FACIAL",
        "MASCARILLA DESECHABLE", "RESPIRADOR DOBLE VIA", "RESPIRADOR DE UNA VIA",
        "ESCARPINES", "MANDIL DE SOLDADURA", "ZAPATOS DIELECTRICOS",
        "OVEROL O UNIFORME", "OTROS"
    )

    // Agregamos "RowScope." aquÃ­ ðŸ‘‡
    @Composable
    fun RowScope.TableCell(
        modifier: Modifier = Modifier,
        weight: Float? = null,
        border: Boolean = true,
        bgColor: Color = Color.Transparent,
        contentAlignment: Alignment = Alignment.CenterStart,
        content: @Composable BoxScope.() -> Unit
    ) {
        Box(
            modifier = modifier
                .then(if (weight != null) Modifier.weight(weight) else Modifier)
                .fillMaxHeight()
                .then(if (border) Modifier.border(0.5.dp, Color.Black) else Modifier)
                .background(bgColor)
                .padding(horizontal = 4.dp, vertical = 2.dp),
            contentAlignment = contentAlignment,
            content = content
        )
    }

    Column(
        Modifier
            .fillMaxSize()
            .background(Color.Black.copy(alpha = 0.03f))
            .padding(16.dp)
            .verticalScroll(rememberScrollState())
            .horizontalScroll(rememberScrollState()) // Permite navegar por el documento horizontal
    ) {
        // --- HOJA BLANCA HORIZONTAL ---
        Column(
            Modifier
                .width(900.dp) // Ancho fijo para simular hoja A4 horizontal
                .shadow(4.dp)
                .background(Color.White)
                .padding(24.dp)
        ) {
            // --- 1. ENCABEZADO ---
            Row(Modifier.fillMaxWidth().height(IntrinsicSize.Min).border(1.dp, Color.Black)) {
                TableCell(weight = 0.15f, contentAlignment = Alignment.Center) {
                    Text("RUAG", fontWeight = FontWeight.Black, color = Color.Black, fontSize = 20.sp)
                }
                TableCell(weight = 0.70f, contentAlignment = Alignment.Center) {
                    Text(
                        "CONTROL DE ENTREGA DE EPP POR TRABAJADOR",
                        fontWeight = FontWeight.Bold, fontSize = 14.sp, color = Color.Black, textAlign = TextAlign.Center
                    )
                }
                Column(Modifier.weight(0.15f).fillMaxHeight()) {
                    Box(Modifier.weight(1f).fillMaxWidth().border(0.5.dp, Color.Black).padding(4.dp), contentAlignment = Alignment.CenterStart) {
                        Text("CÃ“DIGO: SG-FOR-08", fontSize = 8.sp, fontWeight = FontWeight.Bold, color = Color.Black)
                    }
                    Box(Modifier.weight(1f).fillMaxWidth().border(0.5.dp, Color.Black).padding(4.dp), contentAlignment = Alignment.CenterStart) {
                        Text("REVISIÃ“N: 03", fontSize = 8.sp, fontWeight = FontWeight.Bold, color = Color.Black)
                    }
                    Box(Modifier.weight(1f).fillMaxWidth().border(0.5.dp, Color.Black).padding(4.dp), contentAlignment = Alignment.CenterStart) {
                        Text("FECHA: 12/12/2025", fontSize = 8.sp, fontWeight = FontWeight.Bold, color = Color.Black)
                    }
                    Box(Modifier.weight(1f).fillMaxWidth().border(0.5.dp, Color.Black).padding(4.dp), contentAlignment = Alignment.CenterStart) {
                        Text("PÃGINA: 01/01", fontSize = 8.sp, fontWeight = FontWeight.Bold, color = Color.Black)
                    }
                }
            }

            Spacer(Modifier.height(8.dp))

            // --- 2. DATOS DEL EMPLEADOR ---
            Box(Modifier.fillMaxWidth().border(1.dp, Color.Black).background(Color(0xFFE5E5E5)).padding(6.dp)) {
                Text("DATOS DEL EMPLEADOR:", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = Color.Black)
            }
            Row(Modifier.fillMaxWidth().height(IntrinsicSize.Min).border(1.dp, Color.Black)) {
                // Cabeceras (Fila 1)
                Column(Modifier.weight(1f)) {
                    Row(Modifier.fillMaxWidth().background(Color(0xFFE5E5E5)).height(IntrinsicSize.Min)) {
                        TableCell(weight = 0.25f, contentAlignment = Alignment.Center) { Text("RAZÃ“N SOCIAL O DENOMINACIÃ“N SOCIAL", fontSize = 8.sp, fontWeight = FontWeight.Bold, color = Color.Black, textAlign = TextAlign.Center) }
                        TableCell(weight = 0.15f, contentAlignment = Alignment.Center) { Text("RUC", fontSize = 8.sp, fontWeight = FontWeight.Bold, color = Color.Black, textAlign = TextAlign.Center) }
                        TableCell(weight = 0.35f, contentAlignment = Alignment.Center) { Text("DOMICILIO (DirecciÃ³n, distrito, departamento, provincia)", fontSize = 8.sp, fontWeight = FontWeight.Bold, color = Color.Black, textAlign = TextAlign.Center) }
                        TableCell(weight = 0.10f, contentAlignment = Alignment.Center) { Text("ACTIVIDAD ECONÃ“MICA", fontSize = 8.sp, fontWeight = FontWeight.Bold, color = Color.Black, textAlign = TextAlign.Center) }
                        TableCell(weight = 0.15f, contentAlignment = Alignment.Center) { Text("NÂº TRABAJADORES", fontSize = 8.sp, fontWeight = FontWeight.Bold, color = Color.Black, textAlign = TextAlign.Center) }
                    }
                    // Valores (Fila 2)
                    Row(Modifier.fillMaxWidth().height(IntrinsicSize.Min)) {
                        TableCell(weight = 0.25f, contentAlignment = Alignment.Center) { Text("RUAG S.R.L. TDA.", fontSize = 9.sp, color = Color.Black, textAlign = TextAlign.Center) }
                        TableCell(weight = 0.15f, contentAlignment = Alignment.Center) { Text("20343680580", fontSize = 9.sp, color = Color.Black, textAlign = TextAlign.Center) }
                        TableCell(weight = 0.35f, contentAlignment = Alignment.Center) { Text("Av. Paseo de la Republica No 4956 , Miraflores - Lima", fontSize = 9.sp, color = Color.Black, textAlign = TextAlign.Center) }
                        TableCell(weight = 0.10f, contentAlignment = Alignment.Center) { Text("ConstrucciÃ³n", fontSize = 9.sp, color = Color.Black, textAlign = TextAlign.Center) }
                        TableCell(weight = 0.15f, contentAlignment = Alignment.Center) { Text("", fontSize = 9.sp, color = Color.Black, textAlign = TextAlign.Center) }
                    }
                }
            }

            Spacer(Modifier.height(8.dp))

            // --- 3. DATOS DEL TRABAJADOR ---
            Column(Modifier.fillMaxWidth().border(1.dp, Color.Black)) {
                Row(Modifier.fillMaxWidth().height(IntrinsicSize.Min)) {
                    TableCell(weight = 0.15f, bgColor = Color(0xFFF2F2F2)) { Text("OBRA:", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = Color.Black) }
                    TableCell(weight = 0.55f) { Text(nombreObra, fontSize = 9.sp, color = Color.Black) }
                    TableCell(weight = 0.10f, bgColor = Color(0xFFF2F2F2)) { Text("CARGO:", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = Color.Black) }
                    TableCell(weight = 0.20f) { Text(cargo, fontSize = 9.sp, color = Color.Black) }
                }
                Row(Modifier.fillMaxWidth().height(IntrinsicSize.Min)) {
                    TableCell(weight = 0.15f, bgColor = Color(0xFFF2F2F2)) { Text("TRABAJADOR:", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = Color.Black) }
                    TableCell(weight = 0.55f) { Text(fullName, fontSize = 9.sp, color = Color.Black) }
                    TableCell(weight = 0.10f, bgColor = Color(0xFFF2F2F2)) { Text("DNI:", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = Color.Black) }
                    TableCell(weight = 0.20f) { Text(dni, fontSize = 9.sp, color = Color.Black) }
                }
                Row(Modifier.fillMaxWidth().height(IntrinsicSize.Min)) {
                    TableCell(weight = 0.15f, bgColor = Color(0xFFF2F2F2)) { Text("ESPECIALIDAD:", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = Color.Black) }
                    TableCell(weight = 0.85f) { Text(cargo, fontSize = 9.sp, color = Color.Black) }
                }
            }

            Spacer(Modifier.height(8.dp))

            // --- 4. TABLA EPP ---
            Column(Modifier.fillMaxWidth().border(1.dp, Color.Black)) {
                // Header (Doble fila)
                Row(Modifier.fillMaxWidth().height(IntrinsicSize.Min).background(Color(0xFFE5E5E5))) {
                    TableCell(weight = 0.20f, contentAlignment = Alignment.Center) { Text("DESCRIPCION DEL ARTICULO", fontSize = 8.sp, fontWeight = FontWeight.Bold, color = Color.Black, textAlign = TextAlign.Center) }

                    // Columnas de entregas
                    val entregas = listOf("1RA ENTREGA", "2DA ENTREGA", "3RA ENTREGA", "4TA ENTREGA")
                    entregas.forEach { entrega ->
                        Column(Modifier.weight(0.20f).border(0.5.dp, Color.Black)) {
                            Box(Modifier.fillMaxWidth().weight(1f).border(0.5.dp, Color.Black), contentAlignment = Alignment.Center) {
                                Text(entrega, fontSize = 8.sp, fontWeight = FontWeight.Bold, color = Color.Black, textAlign = TextAlign.Center, modifier = Modifier.padding(4.dp))
                            }
                            Row(Modifier.fillMaxWidth().weight(1f)) {
                                Box(Modifier.weight(0.5f).fillMaxHeight().border(0.5.dp, Color.Black), contentAlignment = Alignment.Center) {
                                    Text("FECHA", fontSize = 8.sp, fontWeight = FontWeight.Bold, color = Color.Black, modifier = Modifier.padding(4.dp))
                                }
                                Box(Modifier.weight(0.5f).fillMaxHeight().border(0.5.dp, Color.Black), contentAlignment = Alignment.Center) {
                                    Text("FIRMA", fontSize = 8.sp, fontWeight = FontWeight.Bold, color = Color.Black, modifier = Modifier.padding(4.dp))
                                }
                            }
                        }
                    }
                }

                // Filas de los Items
                epps.forEach { epp ->
                    Row(Modifier.fillMaxWidth().height(24.dp)) {
                        TableCell(weight = 0.20f, contentAlignment = Alignment.CenterStart) { Text(epp, fontSize = 8.sp, color = Color.Black) }
                        // Celdas vacÃ­as para fechas y firmas
                        for (i in 1..8) {
                            TableCell(weight = 0.10f) { }
                        }
                    }
                }
            }

            Spacer(Modifier.height(8.dp))

            // --- 5. RESPONSABLE ---
            Column(Modifier.fillMaxWidth().border(1.dp, Color.Black)) {
                Box(Modifier.fillMaxWidth().background(Color(0xFFE5E5E5)).border(0.5.dp, Color.Black).padding(6.dp), contentAlignment = Alignment.Center) {
                    Text("RESPONSABLE DEL REGISTRO", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = Color.Black)
                }
                Row(Modifier.fillMaxWidth().height(IntrinsicSize.Min)) {
                    TableCell(weight = 0.20f) { Text("Nombre:", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = Color.Black) }
                    TableCell(weight = 0.80f) { }
                }
                Row(Modifier.fillMaxWidth().height(IntrinsicSize.Min)) {
                    TableCell(weight = 0.20f) { Text("Cargo:", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = Color.Black) }
                    TableCell(weight = 0.80f) { }
                }
                Row(Modifier.fillMaxWidth().height(IntrinsicSize.Min)) {
                    TableCell(weight = 0.20f) { Text("Fecha:", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = Color.Black) }
                    TableCell(weight = 0.80f) { }
                }
                Row(Modifier.fillMaxWidth().height(50.dp)) {
                    TableCell(weight = 0.20f, contentAlignment = Alignment.TopStart) { Text("Firma:", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = Color.Black) }
                    TableCell(weight = 0.80f) { }
                }
            }
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun InduccionHombreNuevoLayout(ficha: JsonObject?) {
    // FunciÃ³n segura para extraer datos
    fun getStr(key: String): String {
        val element = ficha?.get(key)
        return if (element != null && element !is kotlinx.serialization.json.JsonNull) {
            element.jsonPrimitive.content
        } else ""
    }

    val nombres = getStr("nombres")
    val apellidoPaterno = getStr("apellido_paterno")
    val apellidoMaterno = getStr("apellido_materno")
    val fullName = listOf(nombres, apellidoPaterno, apellidoMaterno)
        .filter { it.isNotBlank() }
        .joinToString(" ")
        .uppercase()

    val dni = getStr("dni")
    val cargo = getStr("cargo").ifEmpty { "OPERARIO" }
    val firmaUrl = getStr("firma_url").ifEmpty { getStr("url_firma") }
    val today = LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))

    // Extraer datos de los checks (Si existen en el JSON)
    val docData = ficha?.get("doc_states")?.jsonObject?.get("induccion")?.jsonObject?.get("data")?.jsonObject

    val topics = listOf(
        "PolÃ­tica de Seguridad y Salud en el Trabajo.",
        "OrganizaciÃ³n del sistema de gestiÃ³n de la seguridad y salud en el trabajo.",
        "Reglamento interno de Seguridad y Salud en el trabajo.",
        "Derecho y obligaciones de los trabajadores (as) y supervisores (as).",
        "Conceptos bÃ¡sicos de la seguridad y salud en el trabajo.",
        "Reglas de Transito (de ser aplicables a la obra).",
        "Trabajos de alto riesgo.",
        "CÃ³digo de Colores y SeÃ±alizaciÃ³n.",
        "Control de sustancias peligrosas.",
        "PreparaciÃ³n y respuesta ante emergencias.",
        "Equipos de protecciÃ³n personal y protecciones colectivas."
    )

    Column(
        Modifier
            .fillMaxSize()
            .background(Color.Black.copy(alpha = 0.03f))
            .padding(16.dp)
            .verticalScroll(rememberScrollState())
    ) {
        // --- HOJA BLANCA ---
        Column(
            Modifier
                .fillMaxWidth()
                .shadow(4.dp)
                .background(Color.White)
                .padding(24.dp)
        ) {
            // --- 1. ENCABEZADO ---
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(IntrinsicSize.Min)
                    .border(1.dp, Color.Black)
            ) {
                // Logo
                Box(modifier = Modifier.weight(0.20f).fillMaxHeight().padding(4.dp), contentAlignment = Alignment.Center) {
                    Text("RUAG", fontWeight = FontWeight.Black, color = Color.Black, fontSize = 16.sp)
                }
                Box(modifier = Modifier.width(1.dp).fillMaxHeight().background(Color.Black))

                // TÃ­tulo
                Box(modifier = Modifier.weight(0.55f).fillMaxHeight().padding(4.dp), contentAlignment = Alignment.Center) {
                    Text("INDUCCIÃ“N HOMBRE NUEVO", fontSize = 12.sp, fontWeight = FontWeight.Bold, color = Color.Black, textAlign = TextAlign.Center)
                }
                Box(modifier = Modifier.width(1.dp).fillMaxHeight().background(Color.Black))

                // Detalles
                Column(modifier = Modifier.weight(0.25f).fillMaxHeight()) {
                    Row(Modifier.weight(1f).fillMaxWidth().border(0.5.dp, Color.Black).padding(4.dp), verticalAlignment = Alignment.CenterVertically) {
                        Text("CÃ“DIGO:", fontSize = 7.sp, fontWeight = FontWeight.Bold, color = Color.Black, modifier = Modifier.weight(1f))
                        Text("SG-FOR-06", fontSize = 7.sp, color = Color.Black)
                    }
                    Row(Modifier.weight(1f).fillMaxWidth().border(0.5.dp, Color.Black).padding(4.dp), verticalAlignment = Alignment.CenterVertically) {
                        Text("REVISIÃ“N:", fontSize = 7.sp, fontWeight = FontWeight.Bold, color = Color.Black, modifier = Modifier.weight(1f))
                        Text("01", fontSize = 7.sp, color = Color.Black)
                    }
                    Row(Modifier.weight(1f).fillMaxWidth().border(0.5.dp, Color.Black).padding(4.dp), verticalAlignment = Alignment.CenterVertically) {
                        Text("FECHA:", fontSize = 7.sp, fontWeight = FontWeight.Bold, color = Color.Black, modifier = Modifier.weight(1f))
                        Text("04/01/2024", fontSize = 7.sp, color = Color.Black)
                    }
                    Row(Modifier.weight(1f).fillMaxWidth().border(0.5.dp, Color.Black).padding(4.dp), verticalAlignment = Alignment.CenterVertically) {
                        Text("PÃGINA:", fontSize = 7.sp, fontWeight = FontWeight.Bold, color = Color.Black, modifier = Modifier.weight(1f))
                        Text("01 / 01", fontSize = 7.sp, color = Color.Black)
                    }
                }
            }

            Spacer(Modifier.height(32.dp))

            // --- 2. DATOS DEL TRABAJADOR (CORREGIDO CON FLOWROW) ---
            Column(Modifier.padding(horizontal = 8.dp)) {
                // Fila 1 (Nombre y DNI)
                FlowRow(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Row(verticalAlignment = Alignment.Bottom) {
                        Text("NOMBRE: ", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Color.Black)
                        DottedLineText(text = fullName, minWidth = 150.dp)
                    }
                    Row(verticalAlignment = Alignment.Bottom) {
                        Text("DNI: ", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Color.Black)
                        DottedLineText(text = dni, minWidth = 80.dp)
                    }
                }

                Spacer(Modifier.height(16.dp))

                // Fila 2 (Fecha y Cargo)
                FlowRow(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Row(verticalAlignment = Alignment.Bottom) {
                        Text("FECHA DE INGRESO: ", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Color.Black)
                        DottedLineText(text = today, minWidth = 80.dp)
                    }
                    Row(verticalAlignment = Alignment.Bottom) {
                        Text("OCUPACION/CARGO: ", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Color.Black)
                        DottedLineText(text = cargo, minWidth = 120.dp)
                    }
                }
            }

            Spacer(Modifier.height(32.dp))

            // --- 3. LISTA DE TEMAS (CHECKS) ---
            Column(Modifier.padding(horizontal = 16.dp)) {
                topics.forEachIndexed { index, topic ->
                    val isChecked = docData?.get("topic_$index")?.jsonPrimitive?.boolean ?: false
                    Row(verticalAlignment = Alignment.Top, modifier = Modifier.padding(bottom = 12.dp)) {
                        Box(
                            modifier = Modifier.size(14.dp).border(1.dp, Color.Black).padding(top = 1.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            if (isChecked) Text("X", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Color.Black)
                        }
                        Spacer(Modifier.width(12.dp))
                        Text(topic, fontSize = 10.sp, color = Color.Black)
                    }
                }
            }

            Spacer(Modifier.height(48.dp))

            // --- 4. FECHA AL PIE (CORREGIDO CON COMPONENTE ANTI-SQUISH) ---
            Row(modifier = Modifier.fillMaxWidth().padding(end = 24.dp), horizontalArrangement = Arrangement.End, verticalAlignment = Alignment.Bottom) {
                Text("Fecha: ", fontSize = 10.sp, color = Color.Black)
                SolidLineText(text = today, minWidth = 80.dp)
            }

            Spacer(Modifier.height(64.dp))

            // --- 5. FIRMAS ---
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Bottom
            ) {
                // Firma Trabajador
                Column(modifier = Modifier.weight(1f).padding(end = 24.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                    Box(modifier = Modifier.height(70.dp).fillMaxWidth(), contentAlignment = Alignment.BottomCenter) {
                        if (firmaUrl.isNotEmpty()) {
                            AsyncImage(
                                model = firmaUrl,
                                contentDescription = "Firma",
                                modifier = Modifier.fillMaxSize(),
                                contentScale = ContentScale.Fit
                            )
                        }
                    }
                    Canvas(modifier = Modifier.fillMaxWidth().height(1.dp)) {
                        drawLine(color = Color.Black, start = Offset(0f, 0f), end = Offset(size.width, 0f), pathEffect = PathEffect.dashPathEffect(floatArrayOf(5f, 5f)))
                    }
                    Text("Firma del Trabajador.", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = Color.Black, modifier = Modifier.padding(top = 4.dp))
                }

                // Firma Supervisor
                Column(modifier = Modifier.weight(1f).padding(start = 24.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                    Box(modifier = Modifier.height(70.dp).fillMaxWidth())
                    Canvas(modifier = Modifier.fillMaxWidth().height(1.dp)) {
                        drawLine(color = Color.Black, start = Offset(0f, 0f), end = Offset(size.width, 0f), pathEffect = PathEffect.dashPathEffect(floatArrayOf(5f, 5f)))
                    }
                    Text(
                        "VÂ°BÂ° del Supervisor de Seguridad y\nSalud en el Trabajo o Prevencionista de Riesgos",
                        fontSize = 9.sp, fontWeight = FontWeight.Bold, color = Color.Black, textAlign = TextAlign.Center, modifier = Modifier.padding(top = 4.dp)
                    )
                }
            }
        }
    }
}

@Composable
fun RegistroCapacitacionLayout(ficha: JsonObject?) {
    // FunciÃ³n segura para extraer datos
    fun getStr(key: String): String {
        val element = ficha?.get(key)
        return if (element != null && element !is kotlinx.serialization.json.JsonNull) {
            element.jsonPrimitive.content
        } else ""
    }

    val nombres = getStr("nombres")
    val apellidoPaterno = getStr("apellido_paterno")
    val apellidoMaterno = getStr("apellido_materno")
    val fullName = listOf(apellidoPaterno, apellidoMaterno, nombres)
        .filter { it.isNotBlank() }
        .joinToString(" ")
        .uppercase()

    val dni = getStr("dni")
    val cargo = getStr("cargo").ifEmpty { "OPERARIO" }
    val firmaUrl = getStr("firma_url").ifEmpty { getStr("url_firma") }
    val nombreObra = getStr("nombre_obra").ifEmpty { "OBRA CENTRAL" }

    val today = LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))

    // Helper para las celdas de la tabla
    @Composable
    fun RowScope.TableCell( // <--- Â¡AQUÃ ESTÃ LA MAGIA (AÃ±adir RowScope.)!
        modifier: Modifier = Modifier,
        weight: Float? = null,
        border: Boolean = true,
        bgColor: Color = Color.Transparent,
        contentAlignment: Alignment = Alignment.CenterStart,
        content: @Composable BoxScope.() -> Unit
    ) {
        Box(
            modifier = modifier
                .then(if (weight != null) Modifier.weight(weight) else Modifier)
                .fillMaxHeight()
                .then(if (border) Modifier.border(0.5.dp, Color.Black) else Modifier)
                .background(bgColor)
                .padding(horizontal = 6.dp, vertical = 6.dp),
            contentAlignment = contentAlignment,
            content = content
        )
    }

    @Composable
    fun CheckBoxLabel(label: String, checked: Boolean) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Text(label, fontWeight = FontWeight.Bold, fontSize = 9.sp, color = Color.Black)
            Spacer(Modifier.width(4.dp))
            Box(
                modifier = Modifier.size(12.dp).border(1.dp, Color.Black),
                contentAlignment = Alignment.Center
            ) {
                if (checked) Text("X", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = Color.Black)
            }
        }
    }

    Column(
        Modifier
            .fillMaxSize()
            .background(Color.Black.copy(alpha = 0.03f))
            .padding(16.dp)
            .verticalScroll(rememberScrollState())
            .horizontalScroll(rememberScrollState()) // Permite navegar por el documento horizontal
    ) {
        // --- HOJA BLANCA HORIZONTAL ---
        Column(
            Modifier
                .width(900.dp) // Ancho fijo para simular hoja A4 horizontal
                .shadow(4.dp)
                .background(Color.White)
                .padding(24.dp)
        ) {
            // --- 1. ENCABEZADO ---
            Row(Modifier.fillMaxWidth().height(IntrinsicSize.Min).border(1.dp, Color.Black)) {
                TableCell(weight = 0.15f, contentAlignment = Alignment.Center) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("RUAG", fontWeight = FontWeight.Black, color = Color.Black, fontSize = 18.sp)
                        Text("construcciÃ³n", fontSize = 8.sp, color = Color.Black)
                    }
                }
                TableCell(weight = 0.70f, contentAlignment = Alignment.Center) {
                    Text(
                        "REGISTRO DE INDUCCIÃ“N, CAPACITACIÃ“N, ENTRENAMIENTO, SIMULACROS DE EMERGENCIA Y OTROS",
                        fontWeight = FontWeight.Bold, fontSize = 14.sp, color = Color.Black, textAlign = TextAlign.Center
                    )
                }
                Column(Modifier.weight(0.15f).fillMaxHeight()) {
                    Box(Modifier.weight(1f).fillMaxWidth().border(0.5.dp, Color.Black).padding(4.dp), contentAlignment = Alignment.CenterStart) {
                        Text("CÃ“DIGO: SG-FOR-01", fontSize = 8.sp, fontWeight = FontWeight.Bold, color = Color.Black)
                    }
                    Box(Modifier.weight(1f).fillMaxWidth().border(0.5.dp, Color.Black).padding(4.dp), contentAlignment = Alignment.CenterStart) {
                        Text("REVISIÃ“N: 01", fontSize = 8.sp, fontWeight = FontWeight.Bold, color = Color.Black)
                    }
                    Box(Modifier.weight(1f).fillMaxWidth().border(0.5.dp, Color.Black).padding(4.dp), contentAlignment = Alignment.CenterStart) {
                        Text("FECHA: 04/01/2024", fontSize = 8.sp, fontWeight = FontWeight.Bold, color = Color.Black)
                    }
                    Box(Modifier.weight(1f).fillMaxWidth().border(0.5.dp, Color.Black).padding(4.dp), contentAlignment = Alignment.CenterStart) {
                        Text("PÃGINA: 01/01", fontSize = 8.sp, fontWeight = FontWeight.Bold, color = Color.Black)
                    }
                }
            }

            Spacer(Modifier.height(8.dp))

            // --- 2. DATOS DE LA EMPRESA ---
            Row(Modifier.fillMaxWidth().height(IntrinsicSize.Min).border(1.dp, Color.Black)) {
                TableCell(weight = 0.20f, contentAlignment = Alignment.Center) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("RAZÃ“N SOCIAL O DENOMINACIÃ“N SOCIAL:", fontWeight = FontWeight.Bold, fontSize = 8.sp, color = Color.Black, textAlign = TextAlign.Center)
                        Text("RUAG S.R.L. TDA.", fontSize = 9.sp, color = Color.Black, modifier = Modifier.padding(top = 2.dp))
                    }
                }
                TableCell(weight = 0.15f, contentAlignment = Alignment.Center) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("RUC", fontWeight = FontWeight.Bold, fontSize = 8.sp, color = Color.Black)
                        Text("20343680580", fontSize = 9.sp, color = Color.Black, modifier = Modifier.padding(top = 2.dp))
                    }
                }
                TableCell(weight = 0.35f, contentAlignment = Alignment.Center) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("DOMICILIO (DirecciÃ³n, distrito, departamento, provincia)", fontWeight = FontWeight.Bold, fontSize = 8.sp, color = Color.Black)
                        Text("Av. Paseo de la Republica No 4956 Miraflores - Lima", fontSize = 9.sp, color = Color.Black, modifier = Modifier.padding(top = 2.dp))
                    }
                }
                TableCell(weight = 0.15f, contentAlignment = Alignment.Center) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("ACTIVIDAD ECONÃ“MICA:", fontWeight = FontWeight.Bold, fontSize = 8.sp, color = Color.Black)
                        Text("CONSTRUCCIÃ“N", fontSize = 9.sp, color = Color.Black, modifier = Modifier.padding(top = 2.dp))
                    }
                }
                TableCell(weight = 0.15f, contentAlignment = Alignment.Center) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text("NÂ° TRABAJADORES EN EL CENTRO LABORAL:", fontWeight = FontWeight.Bold, fontSize = 8.sp, color = Color.Black, textAlign = TextAlign.Center)
                        Text("________________", fontSize = 9.sp, color = Color.Black, modifier = Modifier.padding(top = 2.dp))
                    }
                }
            }

            Spacer(Modifier.height(8.dp))

            // --- 3. DETALLES DE LA CAPACITACIÃ“N ---
            Column(Modifier.fillMaxWidth().border(1.dp, Color.Black)) {
                // Checks
                Row(Modifier.fillMaxWidth().height(IntrinsicSize.Min)) {
                    TableCell(weight = 0.15f) { CheckBoxLabel("INDUCCIÃ“N:", false) }
                    TableCell(weight = 0.20f) { CheckBoxLabel("CHARLA DE SEGURIDAD:", false) }
                    TableCell(weight = 0.20f) { CheckBoxLabel("ENTRENAMIENTO:", false) }
                    TableCell(weight = 0.25f) { CheckBoxLabel("SIMULACRO DE EMERGENCIA:", false) }
                    TableCell(weight = 0.20f) { CheckBoxLabel("CAPACITACIÃ“N:", true) }
                }
                // Otros / Lugar
                Row(Modifier.fillMaxWidth().height(IntrinsicSize.Min)) {
                    TableCell(weight = 0.5f) {
                        Row {
                            Text("OTROS (Especificar): ", fontWeight = FontWeight.Bold, fontSize = 9.sp, color = Color.Black)
                        }
                    }
                    TableCell(weight = 0.5f) {
                        Row {
                            Text("LUGAR: ", fontWeight = FontWeight.Bold, fontSize = 9.sp, color = Color.Black)
                            Text(nombreObra, fontSize = 9.sp, color = Color.Black)
                        }
                    }
                }
                // Tema
                Row(Modifier.fillMaxWidth().height(IntrinsicSize.Min)) {
                    TableCell(weight = 1f) {
                        Row {
                            Text("TEMA: ", fontWeight = FontWeight.Bold, fontSize = 9.sp, color = Color.Black)
                            Text("INDUCCIÃ“N GENERAL SSOMA", fontSize = 9.sp, color = Color.Black)
                        }
                    }
                }
            }

            Spacer(Modifier.height(8.dp))

            // --- 4. FECHAS Y FIRMA EXPOSITOR ---
            Column(Modifier.fillMaxWidth().border(1.dp, Color.Black)) {
                Row(Modifier.fillMaxWidth().height(IntrinsicSize.Min)) {
                    TableCell(weight = 0.25f) { Text("FECHA: $today", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = Color.Black) }
                    TableCell(weight = 0.25f) { Text("HORA INICIO:", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = Color.Black) }
                    TableCell(weight = 0.25f) { Text("HORA FIN:", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = Color.Black) }
                    TableCell(weight = 0.25f) { Text("TOTAL HORAS: 1.5 Hrs.", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = Color.Black) }
                }
                Row(Modifier.fillMaxWidth().height(50.dp)) {
                    TableCell(weight = 0.75f, contentAlignment = Alignment.TopStart) {
                        Text("NOMBRE DEL CAPACITADOR O ENTRENADOR:", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = Color.Black)
                    }
                    TableCell(weight = 0.25f, contentAlignment = Alignment.TopCenter) {
                        Text("FIRMA", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = Color.Black)
                    }
                }
            }

            Spacer(Modifier.height(8.dp))

            // --- 5. LISTA DE ASISTENTES ---
            Column(Modifier.fillMaxWidth().border(1.dp, Color.Black)) {
                // Header Tabla
                Row(Modifier.fillMaxWidth().height(IntrinsicSize.Min).background(Color(0xFFF2F2F2))) {
                    TableCell(weight = 0.05f, contentAlignment = Alignment.Center) { Text("NÂ°", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = Color.Black) }
                    TableCell(weight = 0.40f, contentAlignment = Alignment.Center) { Text("APELLIDOS Y NOMBRES DE LOS CAPACITADOS", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = Color.Black) }
                    TableCell(weight = 0.15f, contentAlignment = Alignment.Center) { Text("NÂ° DNI", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = Color.Black) }
                    TableCell(weight = 0.20f, contentAlignment = Alignment.Center) { Text("ESPECIALIDAD/EMPRESA", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = Color.Black) }
                    TableCell(weight = 0.20f, contentAlignment = Alignment.Center) { Text("FIRMA", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = Color.Black) }
                }

                // Fila 1 (Trabajador)
                Row(Modifier.fillMaxWidth().height(40.dp)) {
                    TableCell(weight = 0.05f, contentAlignment = Alignment.Center) { Text("1", fontSize = 9.sp, color = Color.Black) }
                    TableCell(weight = 0.40f) { Text(fullName, fontSize = 9.sp, color = Color.Black) }
                    TableCell(weight = 0.15f, contentAlignment = Alignment.Center) { Text(dni, fontSize = 9.sp, color = Color.Black) }
                    TableCell(weight = 0.20f, contentAlignment = Alignment.Center) { Text("$cargo / RUAG", fontSize = 9.sp, color = Color.Black) }
                    TableCell(weight = 0.20f, contentAlignment = Alignment.Center) {
                        if (firmaUrl.isNotEmpty()) {
                            AsyncImage(
                                model = firmaUrl,
                                contentDescription = "Firma",
                                modifier = Modifier.fillMaxSize().padding(2.dp),
                                contentScale = ContentScale.Fit
                            )
                        }
                    }
                }

                // Filas vacÃ­as para rellenar
                for (i in 2..15) {
                    Row(Modifier.fillMaxWidth().height(24.dp)) {
                        TableCell(weight = 0.05f, contentAlignment = Alignment.Center) { Text("$i", fontSize = 9.sp, color = Color.Black) }
                        TableCell(weight = 0.40f) { }
                        TableCell(weight = 0.15f) { }
                        TableCell(weight = 0.20f) { }
                        TableCell(weight = 0.20f) { }
                    }
                }
            }

            Spacer(Modifier.height(8.dp))

            // --- 6. FOOTER ---
            Column(Modifier.fillMaxWidth().border(1.dp, Color.Black)) {
                Row(Modifier.fillMaxWidth().height(40.dp)) {
                    TableCell(weight = 1f, contentAlignment = Alignment.TopStart) {
                        Text("OBSERVACIONES:", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = Color.Black)
                    }
                }
                Row(Modifier.fillMaxWidth().height(IntrinsicSize.Min).background(Color(0xFFF2F2F2))) {
                    TableCell(weight = 1f, contentAlignment = Alignment.Center) {
                        Text("RESPONSABLE DEL REGISTRO", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = Color.Black)
                    }
                }
                Row(Modifier.fillMaxWidth().height(40.dp)) {
                    TableCell(weight = 0.50f, contentAlignment = Alignment.TopStart) { Text("APELLIDOS Y NOMBRES:", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = Color.Black) }
                    TableCell(weight = 0.50f, contentAlignment = Alignment.TopStart) { Text("FIRMA:", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = Color.Black) }
                }
                Row(Modifier.fillMaxWidth().height(24.dp)) {
                    TableCell(weight = 0.50f, contentAlignment = Alignment.CenterStart) { Text("CARGO:", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = Color.Black) }
                    TableCell(weight = 0.50f, contentAlignment = Alignment.CenterStart) { Text("FECHA:", fontSize = 9.sp, fontWeight = FontWeight.Bold, color = Color.Black) }
                }
            }
        }
    }
}

@OptIn(ExperimentalLayoutApi::class)
@Composable
fun CargoRisstLayout(ficha: JsonObject?) {
    // FunciÃ³n segura para extraer datos del JSON
    fun getStr(key: String): String {
        val element = ficha?.get(key)
        return if (element != null && element !is kotlinx.serialization.json.JsonNull) {
            element.jsonPrimitive.content
        } else ""
    }

    // ExtracciÃ³n de datos
    val nombres = getStr("nombres")
    val apellidoPaterno = getStr("apellido_paterno")
    val apellidoMaterno = getStr("apellido_materno")
    val fullName = listOf(nombres, apellidoPaterno, apellidoMaterno)
        .filter { it.isNotBlank() }
        .joinToString(" ")
        .uppercase()

    val dni = getStr("dni")
    val firmaUrl = getStr("firma_url").ifEmpty { getStr("url_firma") }
    val huellaUrl = getStr("huella_url").ifEmpty { getStr("url_huella") }

    val today = LocalDate.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy"))
    val lugar = "LIMA"

    Column(
        Modifier
            .fillMaxSize()
            // Fondo ligeramente gris oscuro para que resalte la "hoja de papel" blanca
            .background(Color.Black.copy(alpha = 0.03f))
            .padding(16.dp)
            .verticalScroll(rememberScrollState())
    ) {
        // --- HOJA BLANCA DEL DOCUMENTO ---
        Column(
            Modifier
                .fillMaxWidth()
                .shadow(4.dp)
                .background(Color.White)
                .padding(24.dp)
        ) {
            // 1. TABLA CABECERA (Header Table)
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(IntrinsicSize.Min) // Hace que todas las columnas midan lo mismo de alto
                    .border(1.dp, Color.Black)
            ) {
                // Col 1: Logo
                Box(
                    modifier = Modifier.weight(0.25f).fillMaxHeight().padding(4.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text("RUAG", fontWeight = FontWeight.Black, color = Color.Black, fontSize = 16.sp)
                }

                // Divisor
                Box(modifier = Modifier.width(1.dp).fillMaxHeight().background(Color.Black))

                // Col 2: TÃ­tulos
                Column(
                    modifier = Modifier.weight(0.5f).fillMaxHeight().padding(4.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    Text("SISTEMA DE GESTIÃ“N INTEGRADOS", fontSize = 9.sp, color = Color.Black, textAlign = TextAlign.Center)
                    Spacer(Modifier.height(4.dp))
                    Text("REGLAMENTO INTERNO DE SEGURIDAD Y SALUD EN EL TRABAJO", fontSize = 10.sp, fontWeight = FontWeight.Bold, color = Color.Black, textAlign = TextAlign.Center)
                }

                // Divisor
                Box(modifier = Modifier.width(1.dp).fillMaxHeight().background(Color.Black))

                // Col 3: Detalles
                Column(modifier = Modifier.weight(0.25f).fillMaxHeight()) {
                    HeaderDetailRow("CÃ“DIGO:", "SG-RIT-01")
                    Box(Modifier.fillMaxWidth().height(1.dp).background(Color.Black))
                    HeaderDetailRow("REVISIÃ“N:", "01")
                    Box(Modifier.fillMaxWidth().height(1.dp).background(Color.Black))
                    HeaderDetailRow("FECHA:", "04/01/2024")
                    Box(Modifier.fillMaxWidth().height(1.dp).background(Color.Black))
                    HeaderDetailRow("PÃGINA:", "54 de 54")
                }
            }

            Spacer(Modifier.height(20.dp))

            // TÃ­tulo Central
            Text(
                text = "ANEXO NÂ° 3 COMPROMISO",
                modifier = Modifier.fillMaxWidth(),
                textAlign = TextAlign.Center,
                fontWeight = FontWeight.Bold,
                fontSize = 12.sp,
                color = Color.Black
            )

            Spacer(Modifier.height(16.dp))

            // 2. CONTENEDOR ROJO PRINCIPAL
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .border(2.dp, Color(0xFFEF4444)) // Borde Rojo
                    .padding(24.dp)
            ) {
                Column(Modifier.fillMaxWidth()) {

                    Text(
                        text = "REGLAMENTO INTERNO DE SEGURIDAD, SALUD OCUPACIONAL Y MEDIO AMBIENTE\n\nRECEPCIÃ“N DEL REGLAMENTO Y COMPROMISO DE SEGURIDAD, SALUD OCUPACIONAL Y MEDIO AMBIENTE",
                        textAlign = TextAlign.Center,
                        fontWeight = FontWeight.Bold,
                        fontSize = 11.sp,
                        lineHeight = 16.sp,
                        color = Color.Black,
                        modifier = Modifier.fillMaxWidth()
                    )

                    Spacer(Modifier.height(32.dp))

                    // Lugar y Fecha (AQUÃ SE APLICÃ“ EL FLOWROW PARA EVITAR EL APILAMIENTO)
                    FlowRow(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Row(verticalAlignment = Alignment.Bottom) {
                            Text("Lugar: ", fontSize = 11.sp, color = Color.Black)
                            DottedLineText(text = lugar, minWidth = 80.dp)
                        }
                        Row(verticalAlignment = Alignment.Bottom) {
                            Text("Fecha: ", fontSize = 11.sp, color = Color.Black)
                            DottedLineText(text = today, minWidth = 80.dp)
                        }
                    }

                    Spacer(Modifier.height(24.dp))

                    Text(
                        text = "He recibido el Reglamento Interno de Seguridad, Salud Ocupacional y Medio Ambiente de RUAG SRL, comprendo las disposiciones allÃ­ establecidas y me comprometo a cumplirlas siendo Ã©stas condiciÃ³n de empleo.\n\nAsÃ­ mismo, ratifico mi Compromiso con el cumplimiento de la PolÃ­tica de Seguridad, Salud Ocupacional y Medio Ambiente establecidos por RUAG SRL. FAVOR, ESCRIBIR CON LETRA IMPRENTA Y CLARA.",
                        textAlign = TextAlign.Justify,
                        fontSize = 11.sp,
                        color = Color.Black,
                        lineHeight = 16.sp
                    )

                    Spacer(Modifier.height(32.dp))

                    // Campos de llenado
                    Text("Nombres y Apellidos", fontSize = 10.sp, color = Color.Black)
                    DottedLineText(
                        text = fullName,
                        minWidth = androidx.compose.ui.unit.Dp.Unspecified, // Toma el ancho completo
                        modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp)
                    )

                    Text("D.N.I.", fontSize = 10.sp, color = Color.Black)
                    DottedLineText(
                        text = dni,
                        minWidth = 150.dp,
                        modifier = Modifier.padding(bottom = 32.dp)
                    )

                    // Zona de Firmas y Huella
                    Row(
                        modifier = Modifier.fillMaxWidth().padding(top = 24.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.Bottom
                    ) {
                        // Firma
                        Column(
                            modifier = Modifier.weight(1f).padding(end = 32.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Box(
                                modifier = Modifier.height(70.dp).fillMaxWidth(),
                                contentAlignment = Alignment.BottomCenter
                            ) {
                                if (firmaUrl.isNotEmpty()) {
                                    AsyncImage(
                                        model = firmaUrl,
                                        contentDescription = "Firma",
                                        modifier = Modifier.fillMaxSize(),
                                        contentScale = ContentScale.Fit
                                    )
                                }
                            }
                            // LÃ­nea de firma punteada
                            Canvas(modifier = Modifier.fillMaxWidth().height(1.dp)) {
                                drawLine(
                                    color = Color.Black,
                                    start = Offset(0f, 0f),
                                    end = Offset(size.width, 0f),
                                    pathEffect = PathEffect.dashPathEffect(floatArrayOf(5f, 5f))
                                )
                            }
                            Text("Firma", fontSize = 10.sp, color = Color.Black, modifier = Modifier.padding(top = 4.dp))
                        }

                        // Huella
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(70.dp, 90.dp)
                                    .border(1.dp, Color.Black, RoundedCornerShape(4.dp))
                                    .padding(4.dp),
                                contentAlignment = Alignment.Center
                            ) {
                                if (huellaUrl.isNotEmpty()) {
                                    AsyncImage(
                                        model = huellaUrl,
                                        contentDescription = "Huella",
                                        modifier = Modifier.fillMaxSize(),
                                        contentScale = ContentScale.Fit
                                    )
                                }
                            }
                            Text("Huella Digital", fontSize = 10.sp, color = Color.Black, modifier = Modifier.padding(top = 8.dp))
                        }
                    }
                }
            }
        }
    }
}

// --- COMPONENTES AUXILIARES PARA EL DIBUJO DEL DOCUMENTO ---

@Composable
fun HeaderDetailRow(label: String, value: String) {
    Row(Modifier.fillMaxWidth().padding(4.dp), verticalAlignment = Alignment.CenterVertically) {
        Text(label, fontWeight = FontWeight.Bold, fontSize = 7.sp, color = Color.Black)
        Spacer(Modifier.width(2.dp))
        Text(value, fontSize = 7.sp, color = Color.Black, maxLines = 1, softWrap = false, overflow = TextOverflow.Ellipsis)
    }
}

// Â¡PÃ‰GALO AQUÃ!
@Composable
fun SolidLineText(text: String, minWidth: androidx.compose.ui.unit.Dp, modifier: Modifier = Modifier) {
    Column(modifier = modifier.widthIn(min = minWidth), horizontalAlignment = Alignment.CenterHorizontally) {
        Text(
            text = text,
            fontSize = 11.sp,
            fontWeight = FontWeight.Bold,
            color = Color.Black,
            modifier = Modifier.padding(start = 4.dp, end = 4.dp, bottom = 2.dp),
            maxLines = 1,
            softWrap = false,
            overflow = TextOverflow.Ellipsis
        )
        Box(Modifier.fillMaxWidth().height(1.dp).background(Color.Black))
    }
}

// LÃNEA PUNTEADA (CORREGIDA)
@Composable
fun DottedLineText(text: String, minWidth: androidx.compose.ui.unit.Dp, modifier: Modifier = Modifier) {
    Column(modifier = modifier.widthIn(min = minWidth), horizontalAlignment = Alignment.CenterHorizontally) {
        Text(
            text = text,
            fontSize = 11.sp,
            fontWeight = FontWeight.Bold,
            color = Color.Black,
            modifier = Modifier.padding(start = 4.dp, end = 4.dp, bottom = 2.dp),
            maxLines = 1,
            softWrap = false,
            overflow = TextOverflow.Ellipsis
        )
        androidx.compose.foundation.Canvas(modifier = Modifier.fillMaxWidth().height(1.dp)) {
            drawLine(
                color = Color.Black,
                start = androidx.compose.ui.geometry.Offset(0f, 0f),
                end = androidx.compose.ui.geometry.Offset(size.width, 0f),
                pathEffect = androidx.compose.ui.graphics.PathEffect.dashPathEffect(floatArrayOf(5f, 5f))
            )
        }
    }
}

@Composable
fun RenderDocumentContent(docId: String, ficha: JsonObject?) {
    Column(Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(24.dp).background(Color.White)) {
        Text(ALL_DOC_LABELS[docId] ?: "Documento", fontSize=20.sp, fontWeight=FontWeight.Bold, color=Color.Black)
        Spacer(Modifier.height(16.dp))
        Text("Este es un documento generado digitalmente.", color=Color.Gray)
    }
}
