# Graph Report - ruag-webapp  (2026-11-11)

## Corpus Check
- Large corpus: 224 files · ~3,001,718 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder.

## Summary
- 766 nodes · 1835 edges · 35 communities (29 shown, 6 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Portal Obrero Dashboard
- Reporte Estadistico SSOMA
- Codigo Android Copia
- Colaboracion Admins
- Induccion SSOMA
- Iconos Animados
- Login y Layout
- Android Copia 2
- Dependencias
- Panel Admin
- Config Proyecto
- API Reporte SSOMA
- TSConfig
- Iconos Admin y Tour
- API Accesos
- API Imprimir Docs
- Dev Dependencias
- API Correo e Import
- API Fechas IA
- Android Docs Copia
- Lottie y Soporte
- Importacion Masiva
- Grupo 22
- Grupo 23
- Grupo 24
- Grupo 25
- Grupo 26
- Grupo 27
- Grupo 28
- Grupo 29
- Grupo 30
- Grupo 31
- Grupo 32
- Grupo 33
- Grupo 34

## God Nodes (most connected - your core abstractions)
1. `react` - 51 edges
2. `createClient()` - 46 edges
3. `AdminTable()` - 32 edges
4. `AdminPage()` - 30 edges
5. `lucide-react` - 30 edges
6. `NormalizedSignatureImage()` - 29 edges
7. `DashboardScreen()` - 26 edges
8. `next` - 25 edges
9. `framer-motion` - 22 edges
10. `sonner` - 21 edges

## Surprising Connections (you probably didn't know these)
- `AdminPage()` --calls--> `AccesosManager()`  [EXTRACTED]
  app/admin/page.tsx → components/AccesosManager.tsx
- `AdminPage()` --calls--> `AdminCollaboration()`  [EXTRACTED]
  app/admin/page.tsx → components/AdminCollaboration.tsx
- `AdminPage()` --calls--> `AdminGifFilters()`  [EXTRACTED]
  app/admin/page.tsx → components/AdminGifIcon.tsx
- `AdminPage()` --calls--> `AdminGifIcon()`  [EXTRACTED]
  app/admin/page.tsx → components/AdminGifIcon.tsx
- `AdminPage()` --calls--> `AdminTable()`  [EXTRACTED]
  app/admin/page.tsx → components/AdminTable.tsx

## Import Cycles
- None detected.

## Communities (35 total, 6 thin omitted)

### Community 0 - "Portal Obrero Dashboard"
Cohesion: 0.05
Nodes (100): renderSignedDocumentPreview(), buildDocumentFormState(), buildDocumentPayload(), COVID_RISK_FIELDS, COVID_SYMPTOM_FIELDS, DashboardPage(), DOC_CONTENT, DOC_LABELS_RRHH (+92 more)

### Community 1 - "Reporte Estadistico SSOMA"
Cohesion: 0.06
Nodes (80): AdminSsomaStatisticalReportPage(), getDefaultMonthLabel(), PublicSsomaStatisticalReportPage(), SsomaReportReviewModal(), SsomaReviewInbox(), AccidentRelationTable(), ActivitiesTable(), CompanyCountTable() (+72 more)

### Community 3 - "Colaboracion Admins"
Cohesion: 0.06
Nodes (58): AdminPresencePill(), AdminChatPanel(), AdminCollaboration(), ChatMsg, COLLAB_PALETTE, CollabContext, CollabContextValue, CollabPeer (+50 more)

### Community 4 - "Induccion SSOMA"
Cohesion: 0.06
Nodes (46): InduccionSSOMA(), WorkerCard(), InduccionPage(), QUESTIONS, Acceso, AccesosManager(), CrearCuentaModal(), CredencialModal() (+38 more)

### Community 5 - "Iconos Animados"
Cohesion: 0.10
Nodes (36): ANIMATED_ICONS, AnimatedIcon(), AnimatedIconKey, AnimatedIconProps, SURFACES, DocumentPreviewModal(), DocumentPreviewModalProps, getDocumentKind() (+28 more)

### Community 6 - "Login y Layout"
Cohesion: 0.12
Nodes (24): metadata, RootLayout(), AuthField(), AuthPage(), FeatureRow(), GifBadge(), initialRegisterState, LoginState (+16 more)

### Community 7 - "Android Copia 2"
Cohesion: 0.17
Nodes (24): AccountSettingsSheet(), ActaDerechoSaberLayout(), ActaEntregaIpercLayout(), buildChecklistState(), buildDocumentData(), CargoPoliticaPrevencionLayout(), CargoRisstLayout(), CargoRitLayout() (+16 more)

### Community 8 - "Dependencias"
Cohesion: 0.09
Nodes (23): dependencies, canvas-confetti, driver.js, exceljs, file-saver, framer-motion, html2canvas, jspdf (+15 more)

### Community 9 - "Panel Admin"
Cohesion: 0.15
Nodes (21): AdminDocsDrawer(), AdminPage(), AdminProfileSettings(), AdminRRHHDrawer(), AdminSignedPreviewModal(), AdminUploadDrawer(), DIGITAL_DOCS, DocDefinition (+13 more)

### Community 10 - "Config Proyecto"
Cohesion: 0.10
Nodes (20): eslintConfig, name, private, version, eslint, eslint-config-next, html2canvas, jspdf-autotable (+12 more)

### Community 11 - "API Reporte SSOMA"
Cohesion: 0.19
Nodes (15): dynamic, GET(), POST(), allowedEvidenceCategories, dynamic, ensureReportExists(), POST(), resolveToken() (+7 more)

### Community 12 - "TSConfig"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 13 - "Iconos Admin y Tour"
Cohesion: 0.17
Nodes (13): AdminGifFilters(), AdminGifIconProps, AdminGifVariant, AdminTour(), AdminTourProps, getScrollableAncestors(), scrollElementIntoView(), getScrollableAncestors() (+5 more)

### Community 14 - "API Accesos"
Cohesion: 0.27
Nodes (12): generateTempPassword(), GET(), guardarCredencial(), isValidEmail(), POST(), requireAdmin(), runtime, supabaseAdmin (+4 more)

### Community 15 - "API Imprimir Docs"
Cohesion: 0.19
Nodes (11): dmy(), DocDef, DOCS, Field, FieldType, fullName(), GET(), imgBytes() (+3 more)

### Community 16 - "Dev Dependencias"
Cohesion: 0.18
Nodes (11): devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/file-saver, @types/node, @types/nodemailer (+3 more)

### Community 17 - "API Correo e Import"
Cohesion: 0.24
Nodes (8): isValidEmail(), POST(), runtime, supabaseAdmin, buildAuthEmailMap(), POST(), supabaseAdmin, @supabase/supabase-js

### Community 18 - "API Fechas IA"
Cohesion: 0.33
Nodes (8): buildPrompt(), DocType, fetchImageAsBase64(), maxDuration, parseJsonLoose(), POST(), runtime, toIso()

### Community 19 - "Android Docs Copia"
Cohesion: 0.25
Nodes (6): DocItem(), DocStatus, DocumentsView(), HomeView(), ModernActionButton(), SectionHeader()

### Community 20 - "Lottie y Soporte"
Cohesion: 0.31
Nodes (7): loadLottieWeb(), LottieJsonIcon(), LottieJsonIconProps, SUPPORT_PWA_URL, SupportButton(), SupportButtonProps, SupportSidebarItem()

### Community 21 - "Importacion Masiva"
Cohesion: 0.36
Nodes (7): Failure, FileSlot(), LogLevel, LogLine, MassImport(), StatCard(), TerminalLine()

### Community 22 - "Grupo 22"
Cohesion: 0.29
Nodes (5): BiometricModal(), BiometricFingerprint(), BiometricFingerprintProps, BiometricSignature(), BiometricSignatureProps

### Community 23 - "Grupo 23"
Cohesion: 0.29
Nodes (5): dynamic, SMTP_CONFIG, supabase, transporter, nodemailer

### Community 24 - "Grupo 24"
Cohesion: 0.43
Nodes (5): BiometricBatchUpload(), buildBiometricUpdate(), getSignatureUrl(), normalizeBiometricFields(), WorkerWithBiometrics

### Community 26 - "Grupo 26"
Cohesion: 0.33
Nodes (5): ICON_PATHS, IconName, Variant, variants, WiredLinealIcon()

### Community 27 - "Grupo 27"
Cohesion: 0.50
Nodes (4): LordIcon(), LORDICON_SOURCES, LordIconProps, toFallbackSvg()

### Community 28 - "Grupo 28"
Cohesion: 0.40
Nodes (5): scripts, build, dev, lint, start

### Community 29 - "Grupo 29"
Cohesion: 0.40
Nodes (4): Cargo, Epp, Riesgo, SsomaRecord

### Community 30 - "Grupo 30"
Cohesion: 1.00
Nodes (3): AdminFileItem(), AdminFileStatus, UploadsView()

## Knowledge Gaps
- **12 isolated node(s):** `@types/canvas-confetti`, `jspdf-autotable`, `motion`, `react-dom`, `@tailwindcss/postcss` (+7 more)
  These have ≤1 connection - possible missing edges. (Counts symbols only; 303 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `Grupo 25` to `Portal Obrero Dashboard`, `Reporte Estadistico SSOMA`, `Induccion SSOMA`, `Iconos Animados`, `Login y Layout`, `Panel Admin`, `Config Proyecto`, `API Reporte SSOMA`, `Iconos Admin y Tour`, `API Accesos`, `API Imprimir Docs`, `API Correo e Import`, `API Fechas IA`, `Grupo 23`, `Grupo 26`?**
  _High betweenness centrality (0.154) - this node is a cross-community bridge._
- **What connects `@types/canvas-confetti`, `jspdf-autotable`, `motion` to the rest of the system?**
  _12 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Portal Obrero Dashboard` be split into smaller, more focused modules?**
  _Cohesion score 0.050560224089635855 - nodes in this community are weakly interconnected._
- **Why does `react` connect `Portal Obrero Dashboard` to `Reporte Estadistico SSOMA`, `Colaboracion Admins`, `Induccion SSOMA`, `Iconos Animados`, `Login y Layout`, `Panel Admin`, `Config Proyecto`, `Iconos Admin y Tour`, `Lottie y Soporte`, `Importacion Masiva`, `Grupo 22`, `Grupo 24`, `Grupo 27`?**
  _High betweenness centrality (0.138) - this node is a cross-community bridge._
- **Should `Reporte Estadistico SSOMA` be split into smaller, more focused modules?**
  _Cohesion score 0.06335204490777867 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `Reporte Estadistico SSOMA` to `Portal Obrero Dashboard`, `Colaboracion Admins`, `Induccion SSOMA`, `Iconos Animados`, `Login y Layout`, `Panel Admin`, `Config Proyecto`, `Iconos Admin y Tour`, `Lottie y Soporte`, `Importacion Masiva`, `Grupo 22`, `Grupo 24`?**
  _High betweenness centrality (0.048) - this node is a cross-community bridge._
- **Should `Codigo Android Copia` be split into smaller, more focused modules?**
  _Cohesion score 0.02631578947368421 - nodes in this community are weakly interconnected._