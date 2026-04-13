package com.ruag.digital.ui

import androidx.compose.animation.AnimatedContentTransitionScope
import androidx.compose.animation.core.tween
import androidx.compose.runtime.Composable
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.ruag.digital.data.SupabaseClient
import com.ruag.digital.ui.screens.DashboardScreen
import com.ruag.digital.ui.screens.LoginScreen
import com.ruag.digital.ui.screens.RegisterScreen
import com.ruag.digital.ui.screens.WorkerFormScreen
import com.ruag.digital.ui.screens.SplashScreen // <-- IMPORTAMOS EL SPLASH
import io.github.jan.supabase.gotrue.auth

@Composable
fun RuagNavigation() {
    val navController = rememberNavController()

    // Calculamos a dónde debe ir el usuario DESPUÉS de la animación del splash
    val nextDestination = if (SupabaseClient.client.auth.currentSessionOrNull() != null) "dashboard" else "login"

    // Cambiamos el startDestination para que SIEMPRE inicie en el splash
    NavHost(navController = navController, startDestination = "splash") {

        // --- NUEVA RUTA: SPLASH ---
        composable("splash") {
            // Le pasamos el destino final al Splash
            SplashScreen(navController = navController, nextDestination = nextDestination)
        }

        composable("login") { LoginScreen(navController) }

        composable(
            route = "register",
            enterTransition = { slideIntoContainer(AnimatedContentTransitionScope.SlideDirection.Left, tween(400)) },
            exitTransition = { slideOutOfContainer(AnimatedContentTransitionScope.SlideDirection.Right, tween(400)) }
        ) { RegisterScreen(navController) }

        // El Dashboard es el centro de mando
        composable("dashboard") { DashboardScreen(navController) }

        // El formulario es una pantalla secundaria
        composable(
            route = "worker_form",
            enterTransition = { slideIntoContainer(AnimatedContentTransitionScope.SlideDirection.Up, tween(400)) },
            exitTransition = { slideOutOfContainer(AnimatedContentTransitionScope.SlideDirection.Down, tween(400)) }
        ) {
            WorkerFormScreen(navController)
        }
    }
}
