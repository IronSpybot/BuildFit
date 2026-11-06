/**
 * PulseTrack iOS 27 Architecture & Swift Codebase Repository
 * Contains complete, production-ready Swift, SwiftData, HealthKit, and Gemini AI source files.
 */

export interface SwiftFile {
  id: string;
  filename: string;
  path: string;
  category: 'App' | 'Models' | 'Services' | 'ViewModels' | 'Views' | 'Components';
  description: string;
  code: string;
}

export const SWIFT_PROJECT_STRUCTURE = `
PulseTrack/
├── App/
│   └── PulseTrackApp.swift              // @main App lifecycle with SwiftData ModelContainer
├── Models/
│   ├── UserProfile.swift                // SwiftData @Model for body metrics, BMR, TDEE
│   ├── DailyLog.swift                   // SwiftData @Model for daily step, water, & macro totals
│   └── MealEntry.swift                  // SwiftData @Model for Breakfast, Lunch, Dinner items
├── Services/
│   ├── GeminiService.swift              // [NEW] Google Generative AI natural language macro parser
│   ├── HealthKitManager.swift           // [UPDATED] HKHealthStore: Steps, Dietary Water, & Weekly Collection
│   └── NutritionCalculator.swift        // Pure mathematical formulas (Mifflin-St Jeor, TDEE, Macros)
├── ViewModels/
│   ├── DashboardViewModel.swift         // MVVM state coordinator for rings, steps, water & meals
│   ├── MealEntryViewModel.swift         // [NEW] Natural language AI parsing & SwiftData insertion
│   └── ProfileViewModel.swift           // Metric updates and real-time metabolic recalculations
└── Views/
    ├── MainDashboardView.swift          // [UPDATED] Concentric rings, +250ml/+500ml water, springs, hero transition
    ├── MealEntryView.swift              // [UPDATED] AI text prompt field, auto-macro fill, haptics
    ├── WeeklyTrendsView.swift           // [NEW] Swift Charts 7-day Step and Hydration bar charts
    ├── OnboardingProfileView.swift      // User body metrics onboarding & TDEE breakdown
    └── Components/
        ├── ConcentricRingsView.swift    // Custom SwiftUI Canvas/Shape multi-ring chart
        ├── GlassmorphicCard.swift       // iOS 27 Ultra-thin material container with spring scale
        └── StepProgressCard.swift       // Dedicated daily step gauge with live sync badge
`;

export const SWIFT_CODE_FILES: SwiftFile[] = [
  {
    id: 'gemini-service',
    filename: 'GeminiService.swift',
    path: 'Services/GeminiService.swift',
    category: 'Services',
    description: 'Natural language food estimation service using Google Generative AI SDK with strict JSON schema.',
    code: `//
//  GeminiService.swift
//  PulseTrack
//
//  Google Generative AI service for natural language nutritional macro estimation.
//

import Foundation
import GoogleGenerativeAI

/// Decoded macro nutrition estimate returned strictly by Gemini
public struct MealEstimationResult: Codable, Equatable {
    public let name: String
    public let calories: Double
    public let protein: Double
    public let carbs: Double
    public let fat: Double
    
    public init(name: String, calories: Double, protein: Double, carbs: Double, fat: Double) {
        self.name = name
        self.calories = calories
        self.protein = protein
        self.carbs = carbs
        self.fat = fat
    }
}

public enum GeminiServiceError: LocalizedError {
    case missingAPIKey
    case emptyResponse
    case invalidJSONParsing
    case serverError(String)
    
    public var errorDescription: String? {
        switch self {
        case .missingAPIKey:
            return "Gemini API key is missing. Configure it in your app settings or Info.plist."
        case .emptyResponse:
            return "Gemini returned an empty response. Please try rephrasing your meal."
        case .invalidJSONParsing:
            return "Could not decode structured nutrition JSON from the model response."
        case .serverError(let message):
            return "Gemini Service error: \\(message)"
        }
    }
}

public final class GeminiService {
    public static let shared = GeminiService()
    
    private let model: GenerativeModel
    
    private init() {
        // Retrieve API key from ProcessInfo or Bundle (e.g., Info.plist / Secure Storage)
        let apiKey = ProcessInfo.processInfo.environment["GEMINI_API_KEY"]
            ?? Bundle.main.infoDictionary?["GEMINI_API_KEY"] as? String
            ?? ""
        
        let systemInstruction = """
        You are a licensed clinical dietitian and sports nutritionist.
        The user will describe food they consumed in natural language (e.g., 'I ate 2 chapatis and chicken curry').
        Estimate the exact nutritional values. If portions are not stated, assume standard single-serving portions.
        You MUST return ONLY a raw JSON object with NO markdown formatting, no code blocks, and no extra commentary.
        Exact JSON Schema required:
        {
          "name": "Concise clean title (e.g. 2 Chapatis & Chicken Curry)",
          "calories": 480,
          "protein": 32.5,
          "carbs": 44.0,
          "fat": 14.0
        }
        """
        
        // Initialize Gemini model with strict JSON response configuration
        self.model = GenerativeModel(
            name: "gemini-3.8-flash",
            apiKey: apiKey,
            generationConfig: GenerationConfig(
                responseMIMEType: "application/json"
            ),
            systemInstruction: ModelContent(role: "system", parts: systemInstruction)
        )
    }
    
    /// Parses natural language food input into structured macro nutrition
    public func estimateNutrients(for prompt: String) async throws -> MealEstimationResult {
        guard !prompt.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            throw GeminiServiceError.emptyResponse
        }
        
        do {
            let response = try await model.generateContent("Analyze this meal: \"\\(prompt)\"")
            guard let rawText = response.text?.trimmingCharacters(in: .whitespacesAndNewlines), !rawText.isEmpty else {
                throw GeminiServiceError.emptyResponse
            }
            
            // Clean any accidental markdown wrap
            let fencePrefix = "^" + String(repeating: "\\u{60}", count: 3) + "json"
            let fenceSuffix = String(repeating: "\\u{60}", count: 3) + "$"
            let cleanedJSON = rawText
                .replacingOccurrences(of: fencePrefix, with: "", options: .regularExpression)
                .replacingOccurrences(of: fenceSuffix, with: "", options: .regularExpression)
                .trimmingCharacters(in: .whitespacesAndNewlines)
            
            guard let data = cleanedJSON.data(using: .utf8) else {
                throw GeminiServiceError.invalidJSONParsing
            }
            
            let decoder = JSONDecoder()
            return try decoder.decode(MealEstimationResult.self, from: data)
        } catch let decodingError as DecodingError {
            print("Failed to decode Gemini JSON: \\(decodingError)")
            throw GeminiServiceError.invalidJSONParsing
        } catch {
            print("Gemini API call failed: \\(error)")
            throw GeminiServiceError.serverError(error.localizedDescription)
        }
    }
}
`,
  },
  {
    id: 'healthkit-manager',
    filename: 'HealthKitManager.swift',
    path: 'Services/HealthKitManager.swift',
    category: 'Services',
    description: 'Updated HealthKit service managing Steps, Dietary Water (+250ml/+500ml), and 7-day Weekly Statistics.',
    code: `//
//  HealthKitManager.swift
//  PulseTrack
//
//  Updated HealthKit manager with Dietary Water logging & 7-day historical trends.
//

import Foundation
import HealthKit
import Observation

public struct DailyMetricTrend: Identifiable, Equatable {
    public let id = UUID()
    public let date: Date
    public let dayName: String
    public let value: Double
    
    public init(date: Date, dayName: String, value: Double) {
        self.date = date
        self.dayName = dayName
        self.value = value
    }
}

@Observable
public final class HealthKitManager {
    public static let shared = HealthKitManager()
    
    private let healthStore = HKHealthStore()
    
    // Observable metrics for SwiftUI
    public var isAuthorized: Bool = false
    public var stepCount: Int = 0
    public var activeCaloriesBurned: Double = 0.0
    public var waterIntakeMl: Double = 0.0
    public var lastSyncTime: Date? = nil
    
    // Historical 7-day collections for Swift Charts
    public var weeklySteps: [DailyMetricTrend] = []
    public var weeklyWater: [DailyMetricTrend] = []
    
    private init() {
        checkHealthKitAvailability()
    }
    
    public func checkHealthKitAvailability() {
        guard HKHealthStore.isHealthDataAvailable() else { return }
    }
    
    /// Requests Read & Write permissions for Steps, Energy, and Dietary Water
    public func requestAuthorization() async {
        guard HKHealthStore.isHealthDataAvailable() else { return }
        
        guard let stepType = HKQuantityType.quantityType(forIdentifier: .stepCount),
              let activeEnergyType = HKQuantityType.quantityType(forIdentifier: .activeEnergyBurned),
              let waterType = HKQuantityType.quantityType(forIdentifier: .dietaryWater) else {
            return
        }
        
        let typesToRead: Set<HKObjectType> = [stepType, activeEnergyType, waterType]
        let typesToWrite: Set<HKSampleType> = [waterType]
        
        do {
            try await healthStore.requestAuthorization(toShare: typesToWrite, read: typesToRead)
            await MainActor.run {
                self.isAuthorized = true
            }
            await refreshAllTodayData()
            await fetchWeeklyHistoricalTrends()
        } catch {
            print("HealthKit Authorization Failed: \\(error)")
        }
    }
    
    public func refreshAllTodayData() async {
        await fetchTodaySteps()
        await fetchTodayActiveEnergy()
        await fetchTodayWater()
    }
    
    // MARK: - Hydration (Dietary Water)
    
    /// Writes water intake directly to Apple Health (e.g. +250ml or +500ml)
    public func addWaterIntake(milliliters: Double) async throws {
        guard let waterType = HKQuantityType.quantityType(forIdentifier: .dietaryWater) else { return }
        
        let quantity = HKQuantity(unit: HKUnit.literUnit(with: .milli), doubleValue: milliliters)
        let sample = HKQuantitySample(
            type: waterType,
            quantity: quantity,
            start: Date(),
            end: Date()
        )
        
        try await healthStore.save(sample)
        
        await MainActor.run {
            self.waterIntakeMl += milliliters
        }
        
        // Refresh weekly chart data
        await fetchWeeklyHistoricalTrends()
    }
    
    /// Queries today's cumulative water consumption
    public func fetchTodayWater() async {
        guard let waterType = HKQuantityType.quantityType(forIdentifier: .dietaryWater) else { return }
        let startOfDay = Calendar.current.startOfDay(for: Date())
        let predicate = HKQuery.predicateForSamples(withStart: startOfDay, end: Date(), options: .strictStartDate)
        
        return await withCheckedContinuation { continuation in
            let query = HKStatisticsQuery(
                quantityType: waterType,
                quantitySamplePredicate: predicate,
                options: .cumulativeSum
            ) { [weak self] _, statistics, _ in
                DispatchQueue.main.async {
                    if let sum = statistics?.sumQuantity() {
                        self?.waterIntakeMl = sum.doubleValue(for: HKUnit.literUnit(with: .milli))
                    }
                    continuation.resume()
                }
            }
            self.healthStore.execute(query)
        }
    }
    
    // MARK: - Steps & Energy
    
    public func fetchTodaySteps() async {
        guard let stepType = HKQuantityType.quantityType(forIdentifier: .stepCount) else { return }
        let startOfDay = Calendar.current.startOfDay(for: Date())
        let predicate = HKQuery.predicateForSamples(withStart: startOfDay, end: Date(), options: .strictStartDate)
        
        return await withCheckedContinuation { continuation in
            let query = HKStatisticsQuery(
                quantityType: stepType,
                quantitySamplePredicate: predicate,
                options: .cumulativeSum
            ) { [weak self] _, statistics, _ in
                DispatchQueue.main.async {
                    if let sum = statistics?.sumQuantity() {
                        self?.stepCount = Int(sum.doubleValue(for: HKUnit.count()))
                        self?.lastSyncTime = Date()
                    }
                    continuation.resume()
                }
            }
            self.healthStore.execute(query)
        }
    }
    
    public func fetchTodayActiveEnergy() async {
        guard let energyType = HKQuantityType.quantityType(forIdentifier: .activeEnergyBurned) else { return }
        let startOfDay = Calendar.current.startOfDay(for: Date())
        let predicate = HKQuery.predicateForSamples(withStart: startOfDay, end: Date(), options: .strictStartDate)
        
        return await withCheckedContinuation { continuation in
            let query = HKStatisticsQuery(
                quantityType: energyType,
                quantitySamplePredicate: predicate,
                options: .cumulativeSum
            ) { [weak self] _, statistics, _ in
                DispatchQueue.main.async {
                    if let sum = statistics?.sumQuantity() {
                        self?.activeCaloriesBurned = sum.doubleValue(for: HKUnit.kilocalorie())
                    } else {
                        self?.activeCaloriesBurned = Double(self?.stepCount ?? 0) * 0.04
                    }
                    continuation.resume()
                }
            }
            self.healthStore.execute(query)
        }
    }
    
    // MARK: - HKStatisticsCollectionQuery for 7-Day Weekly Trends
    
    public func fetchWeeklyHistoricalTrends() async {
        guard let stepType = HKQuantityType.quantityType(forIdentifier: .stepCount),
              let waterType = HKQuantityType.quantityType(forIdentifier: .dietaryWater) else { return }
        
        let calendar = Calendar.current
        let now = Date()
        guard let startDate = calendar.date(byAdding: .day, value: -6, to: calendar.startOfDay(for: now)) else { return }
        
        var interval = DateComponents()
        interval.day = 1
        
        // 1. Fetch Weekly Steps
        let stepCollection = HKStatisticsCollectionQuery(
            quantityType: stepType,
            quantitySamplePredicate: nil,
            options: .cumulativeSum,
            anchorDate: calendar.startOfDay(for: now),
            intervalComponents: interval
        )
        
        stepCollection.initialResultsHandler = { [weak self] _, results, _ in
            guard let results = results else { return }
            var trends: [DailyMetricTrend] = []
            let dayFormatter = DateFormatter()
            dayFormatter.dateFormat = "EEE"
            
            results.enumerateStatistics(from: startDate, to: now) { statistics, _ in
                let value = statistics.sumQuantity()?.doubleValue(for: HKUnit.count()) ?? 0.0
                trends.append(DailyMetricTrend(
                    date: statistics.startDate,
                    dayName: dayFormatter.string(from: statistics.startDate),
                    value: value
                ))
            }
            
            DispatchQueue.main.async {
                self?.weeklySteps = trends
            }
        }
        self.healthStore.execute(stepCollection)
        
        // 2. Fetch Weekly Water
        let waterCollection = HKStatisticsCollectionQuery(
            quantityType: waterType,
            quantitySamplePredicate: nil,
            options: .cumulativeSum,
            anchorDate: calendar.startOfDay(for: now),
            intervalComponents: interval
        )
        
        waterCollection.initialResultsHandler = { [weak self] _, results, _ in
            guard let results = results else { return }
            var trends: [DailyMetricTrend] = []
            let dayFormatter = DateFormatter()
            dayFormatter.dateFormat = "EEE"
            
            results.enumerateStatistics(from: startDate, to: now) { statistics, _ in
                let value = statistics.sumQuantity()?.doubleValue(for: HKUnit.literUnit(with: .milli)) ?? 0.0
                trends.append(DailyMetricTrend(
                    date: statistics.startDate,
                    dayName: dayFormatter.string(from: statistics.startDate),
                    value: value
                ))
            }
            
            DispatchQueue.main.async {
                self?.weeklyWater = trends
            }
        }
        self.healthStore.execute(waterCollection)
    }
}
`,
  },
  {
    id: 'weekly-trends-view',
    filename: 'WeeklyTrendsView.swift',
    path: 'Views/WeeklyTrendsView.swift',
    category: 'Views',
    description: 'Swift Charts view displaying 7-day Step Count and Dietary Water trends from HealthKit.',
    code: `//
//  WeeklyTrendsView.swift
//  PulseTrack
//
//  Swift Charts 7-day activity & hydration analytics view.
//

import SwiftUI
import Charts

public struct WeeklyTrendsView: View {
    @Environment(\\.dismiss) private var dismiss
    @State private var healthKit = HealthKitManager.shared
    
    private let stepGoal: Double = 10_000
    private let waterGoalMl: Double = 2_500
    
    public init() {}
    
    public var body: some View {
        NavigationStack {
            ZStack {
                Color.black.ignoresSafeArea()
                
                ScrollView {
                    VStack(spacing: 24) {
                        // Header Summary
                        VStack(alignment: .leading, spacing: 4) {
                            Text("HEALTH ANALYTICS")
                                .font(.system(size: 11, weight: .bold))
                                .foregroundStyle(Color(red: 0.39, green: 0.82, blue: 1.0))
                                .tracking(0.8)
                            
                            Text("7-Day Trends")
                                .font(.system(size: 28, weight: .bold, design: .rounded))
                                .foregroundStyle(.white)
                            
                            Text("Historical metrics aggregated from Apple HealthKit statistics queries.")
                                .font(.system(size: 13, weight: .medium))
                                .foregroundStyle(.white.opacity(0.6))
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.top, 8)
                        
                        // 1. Steps Bar Chart
                        GlassmorphicCard {
                            VStack(alignment: .leading, spacing: 14) {
                                HStack {
                                    Image(systemName: "figure.walk")
                                        .font(.system(size: 16, weight: .bold))
                                        .foregroundStyle(Color(red: 1.0, green: 0.58, blue: 0.0))
                                    Text("Step Count (7 Days)")
                                        .font(.system(size: 16, weight: .bold, design: .rounded))
                                        .foregroundStyle(.white)
                                    Spacer()
                                    Text("Goal: 10k")
                                        .font(.system(size: 11, weight: .semibold, design: .monospaced))
                                        .foregroundStyle(.white.opacity(0.45))
                                }
                                
                                Chart {
                                    ForEach(healthKit.weeklySteps) { day in
                                        BarMark(
                                            x: .value("Day", day.dayName),
                                            y: .value("Steps", day.value)
                                        )
                                        .foregroundStyle(
                                            LinearGradient(
                                                colors: [
                                                    Color(red: 1.0, green: 0.58, blue: 0.0),
                                                    Color(red: 1.0, green: 0.22, blue: 0.37)
                                                ],
                                                startPoint: .top,
                                                endPoint: .bottom
                                            )
                                        )
                                        .cornerRadius(6)
                                    }
                                    
                                    RuleMark(y: .value("Target", stepGoal))
                                        .lineStyle(StrokeStyle(lineWidth: 1.5, dash: [4, 4]))
                                        .foregroundStyle(Color.white.opacity(0.3))
                                        .annotation(position: .top, alignment: .trailing) {
                                            Text("10k Goal")
                                                .font(.system(size: 9, weight: .bold))
                                                .foregroundStyle(Color.white.opacity(0.5))
                                        }
                                }
                                .chartYAxis {
                                    AxisMarks(position: .leading) { value in
                                        AxisGridLine(stroke: StrokeStyle(lineWidth: 0.5)).foregroundStyle(Color.white.opacity(0.08))
                                        AxisValueLabel() {
                                            if let intVal = value.as(Int.self) {
                                                Text("\\(intVal / 1000)k").font(.system(size: 10, design: .monospaced)).foregroundStyle(Color.white.opacity(0.4))
                                            }
                                        }
                                    }
                                }
                                .chartXAxis {
                                    AxisMarks { value in
                                        AxisValueLabel().foregroundStyle(Color.white.opacity(0.7)).font(.system(size: 11, weight: .semibold))
                                    }
                                }
                                .frame(height: 180)
                            }
                            .padding(18)
                        }
                        
                        // 2. Dietary Water Bar Chart
                        GlassmorphicCard {
                            VStack(alignment: .leading, spacing: 14) {
                                HStack {
                                    Image(systemName: "drop.fill")
                                        .font(.system(size: 16, weight: .bold))
                                        .foregroundStyle(Color(red: 0.39, green: 0.82, blue: 1.0))
                                    Text("Hydration Volume (7 Days)")
                                        .font(.system(size: 16, weight: .bold, design: .rounded))
                                        .foregroundStyle(.white)
                                    Spacer()
                                    Text("Goal: 2.5L")
                                        .font(.system(size: 11, weight: .semibold, design: .monospaced))
                                        .foregroundStyle(.white.opacity(0.45))
                                }
                                
                                Chart {
                                    ForEach(healthKit.weeklyWater) { day in
                                        BarMark(
                                            x: .value("Day", day.dayName),
                                            y: .value("Water", day.value)
                                        )
                                        .foregroundStyle(
                                            LinearGradient(
                                                colors: [
                                                    Color(red: 0.39, green: 0.82, blue: 1.0),
                                                    Color(red: 0.04, green: 0.52, blue: 1.0)
                                                ],
                                                startPoint: .top,
                                                endPoint: .bottom
                                            )
                                        )
                                        .cornerRadius(6)
                                    }
                                    
                                    RuleMark(y: .value("Target", waterGoalMl))
                                        .lineStyle(StrokeStyle(lineWidth: 1.5, dash: [4, 4]))
                                        .foregroundStyle(Color.cyan.opacity(0.4))
                                }
                                .chartYAxis {
                                    AxisMarks(position: .leading) { value in
                                        AxisGridLine(stroke: StrokeStyle(lineWidth: 0.5)).foregroundStyle(Color.white.opacity(0.08))
                                        AxisValueLabel() {
                                            if let doubleVal = value.as(Double.self) {
                                                Text(String(format: "%.1fL", doubleVal / 1000.0)).font(.system(size: 10, design: .monospaced)).foregroundStyle(Color.white.opacity(0.4))
                                            }
                                        }
                                    }
                                }
                                .chartXAxis {
                                    AxisMarks { value in
                                        AxisValueLabel().foregroundStyle(Color.white.opacity(0.7)).font(.system(size: 11, weight: .semibold))
                                    }
                                }
                                .frame(height: 180)
                            }
                            .padding(18)
                        }
                    }
                    .padding(20)
                }
            }
            .navigationTitle("Weekly Trends")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") { dismiss() }
                        .foregroundStyle(Color(red: 0.39, green: 0.82, blue: 1.0))
                        .font(.system(size: 16, weight: .bold))
                }
            }
            .task {
                await healthKit.fetchWeeklyHistoricalTrends()
            }
        }
    }
}
`,
  },
  {
    id: 'meal-entry-view-updated',
    filename: 'MealEntryView.swift',
    path: 'Views/MealEntryView.swift',
    category: 'Views',
    description: 'Updated Meal Entry view with Gemini AI natural language estimation, springs, and haptic feedback.',
    code: `//
//  MealEntryView.swift
//  PulseTrack
//
//  iOS 27 Meal Logger with AI Smart Natural Language Estimation (Gemini).
//

import SwiftUI
import SwiftData

public struct MealEntryView: View {
    @Environment(\\.dismiss) private var dismiss
    @Environment(\\.modelContext) private var modelContext
    
    public let slot: MealSlot
    public let log: DailyLog
    
    // AI Natural Language input
    @State private var naturalLanguagePrompt: String = ""
    @State private var isAnalyzingAI: Bool = false
    @State private var aiErrorMessage: String? = nil
    
    // Explicit Macro State
    @State private var foodName: String = ""
    @State private var caloriesText: String = ""
    @State private var proteinText: String = ""
    @State private var carbsText: String = ""
    @State private var fatText: String = ""
    @State private var isPressedSubmit: Bool = false
    
    public var body: some View {
        NavigationStack {
            ZStack {
                Color.black.ignoresSafeArea()
                
                ScrollView {
                    VStack(spacing: 20) {
                        // Slot Category Badge
                        HStack(spacing: 8) {
                            Image(systemName: slot.iconName)
                                .foregroundStyle(Color(red: 1.0, green: 0.84, blue: 0.04))
                            Text("Logging for \\(slot.rawValue)")
                                .font(.system(size: 16, weight: .bold, design: .rounded))
                                .foregroundStyle(.white)
                        }
                        .padding(.horizontal, 16)
                        .padding(.vertical, 8)
                        .background(.ultraThinMaterial, in: Capsule())
                        .overlay(Capsule().stroke(Color.white.opacity(0.12), lineWidth: 1))
                        
                        // MARK: - 1. AI Smart Natural Language Logging (Gemini)
                        GlassmorphicCard {
                            VStack(alignment: .leading, spacing: 12) {
                                HStack {
                                    Image(systemName: "sparkles")
                                        .foregroundStyle(Color(red: 0.39, green: 0.82, blue: 1.0))
                                    Text("AI Smart Meal Estimation")
                                        .font(.system(size: 14, weight: .bold, design: .rounded))
                                        .foregroundStyle(.white)
                                    Spacer()
                                    Text("Gemini 3.8")
                                        .font(.system(size: 10, weight: .bold, design: .monospaced))
                                        .foregroundStyle(Color(red: 0.39, green: 0.82, blue: 1.0))
                                        .padding(.horizontal, 6)
                                        .padding(.vertical, 2)
                                        .background(Color(red: 0.39, green: 0.82, blue: 1.0).opacity(0.15), in: Capsule())
                                }
                                
                                TextField("e.g. I ate 2 chapatis and chicken curry", text: $naturalLanguagePrompt, axis: .vertical)
                                    .lineLimit(2...4)
                                    .font(.system(size: 15))
                                    .foregroundStyle(.white)
                                    .padding(12)
                                    .background(Color.white.opacity(0.05), in: RoundedRectangle(cornerRadius: 12))
                                
                                Button {
                                    Task {
                                        await analyzeMealWithGemini()
                                    }
                                } label: {
                                    HStack {
                                        if isAnalyzingAI {
                                            ProgressView()
                                                .tint(.black)
                                                .scaleEffect(0.8)
                                            Text("Calculating Macros with Gemini...")
                                                .font(.system(size: 13, weight: .bold))
                                        } else {
                                            Image(systemName: "wand.and.stars")
                                            Text("Estimate Macros with Gemini")
                                                .font(.system(size: 13, weight: .bold))
                                        }
                                    }
                                    .foregroundStyle(.black)
                                    .frame(maxWidth: .infinity)
                                    .padding(.vertical, 12)
                                    .background(
                                        LinearGradient(
                                            colors: [Color(red: 0.39, green: 0.82, blue: 1.0), Color(red: 0.19, green: 0.82, blue: 0.35)],
                                            startPoint: .leading,
                                            endPoint: .trailing
                                        )
                                    )
                                    .clipShape(RoundedRectangle(cornerRadius: 12))
                                }
                                .disabled(naturalLanguagePrompt.trimmingCharacters(in: .whitespaces).isEmpty || isAnalyzingAI)
                                .opacity(naturalLanguagePrompt.trimmingCharacters(in: .whitespaces).isEmpty ? 0.45 : 1.0)
                                .scaleEffect(isAnalyzingAI ? 0.98 : 1.0)
                                .animation(.spring(response: 0.4, dampingFraction: 0.7), value: isAnalyzingAI)
                                
                                if let error = aiErrorMessage {
                                    Text(error)
                                        .font(.system(size: 11))
                                        .foregroundStyle(Color.red.opacity(0.9))
                                }
                            }
                            .padding(16)
                        }
                        
                        // MARK: - 2. Food Description & Manual Tweaks
                        GlassmorphicCard {
                            VStack(alignment: .leading, spacing: 10) {
                                Text("FOOD NAME")
                                    .font(.system(size: 11, weight: .bold))
                                    .foregroundStyle(.white.opacity(0.5))
                                
                                TextField("e.g. 2 Chapatis & Chicken Curry", text: $foodName)
                                    .font(.system(size: 16, weight: .semibold))
                                    .foregroundStyle(.white)
                            }
                            .padding(16)
                        }
                        
                        // Macro Grid
                        GlassmorphicCard {
                            VStack(spacing: 16) {
                                macroField(title: "Calories (kcal)", text: $caloriesText, color: Color(red: 1.0, green: 0.22, blue: 0.37))
                                Divider().background(Color.white.opacity(0.1))
                                HStack(spacing: 12) {
                                    macroField(title: "Protein (g)", text: $proteinText, color: Color(red: 0.19, green: 0.82, blue: 0.35))
                                    macroField(title: "Carbs (g)", text: $carbsText, color: Color(red: 0.39, green: 0.82, blue: 1.0))
                                    macroField(title: "Fats (g)", text: $fatText, color: Color(red: 0.75, green: 0.35, blue: 0.95))
                                }
                            }
                            .padding(16)
                        }
                        
                        // Submit Button with Fluid Scale & Haptics
                        Button {
                            saveMeal()
                        } label: {
                            HStack {
                                Image(systemName: "checkmark.circle.fill")
                                Text("Log to \\(slot.rawValue)")
                            }
                            .font(.system(size: 17, weight: .bold))
                            .foregroundStyle(.black)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 16)
                            .background(
                                LinearGradient(
                                    colors: [Color(red: 0.19, green: 0.82, blue: 0.35), Color(red: 0.10, green: 0.70, blue: 0.28)],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                )
                            )
                            .clipShape(RoundedRectangle(cornerRadius: 16))
                            .shadow(color: Color(red: 0.19, green: 0.82, blue: 0.35).opacity(0.4), radius: 10, y: 4)
                        }
                        .disabled(foodName.trimmingCharacters(in: .whitespaces).isEmpty)
                        .opacity(foodName.trimmingCharacters(in: .whitespaces).isEmpty ? 0.45 : 1.0)
                        .scaleEffect(isPressedSubmit ? 0.95 : 1.0)
                        .animation(.spring(response: 0.4, dampingFraction: 0.7), value: isPressedSubmit)
                    }
                    .padding(20)
                }
            }
            .navigationTitle("Add Meal")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("Cancel") { dismiss() }
                        .foregroundStyle(.white.opacity(0.7))
                }
            }
        }
    }
    
    private func macroField(title: String, text: Binding<String>, color: Color) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title).font(.system(size: 11, weight: .bold)).foregroundStyle(color)
            TextField("0", text: text)
                .keyboardType(.decimalPad)
                .font(.system(size: 16, weight: .semibold, design: .monospaced))
                .foregroundStyle(.white)
        }
    }
    
    // Call Gemini AI
    private func analyzeMealWithGemini() async {
        isAnalyzingAI = true
        aiErrorMessage = nil
        UIImpactFeedbackGenerator(style: .medium).impactOccurred()
        
        do {
            let result = try await GeminiService.shared.estimateNutrients(for: naturalLanguagePrompt)
            withAnimation(.spring(response: 0.4, dampingFraction: 0.7)) {
                foodName = result.name
                caloriesText = "\\(Int(result.calories))"
                proteinText = "\\(Int(result.protein))"
                carbsText = "\\(Int(result.carbs))"
                fatText = "\\(Int(result.fat))"
            }
            UINotificationFeedbackGenerator().notificationOccurred(.success)
        } catch {
            aiErrorMessage = error.localizedDescription
            UINotificationFeedbackGenerator().notificationOccurred(.error)
        }
        isAnalyzingAI = false
    }
    
    private func saveMeal() {
        let newMeal = MealEntry(
            name: foodName.trimmingCharacters(in: .whitespaces),
            slot: slot,
            calories: Double(caloriesText) ?? 0.0,
            proteinGrams: Double(proteinText) ?? 0.0,
            carbsGrams: Double(carbsText) ?? 0.0,
            fatGrams: Double(fatText) ?? 0.0
        )
        newMeal.dailyLog = log
        modelContext.insert(newMeal)
        
        UINotificationFeedbackGenerator().notificationOccurred(.success)
        dismiss()
    }
}
`,
  },
  {
    id: 'main-dashboard-updated',
    filename: 'MainDashboardView.swift',
    path: 'Views/MainDashboardView.swift',
    category: 'Views',
    description: 'Updated Main Dashboard with quick water logging (+250ml/+500ml), weekly trends, and hero transitions.',
    code: `//
//  MainDashboardView.swift
//  PulseTrack
//
//  iPhone 16 iOS 27 OLED Dashboard with Concentric Rings, Hydration, & Hero Transitions.
//

import SwiftUI
import SwiftData

public struct MainDashboardView: View {
    @Environment(\\.modelContext) private var modelContext
    @Query private var userProfiles: [UserProfile]
    @Query private var dailyLogs: [DailyLog]
    
    @Namespace private var heroNamespace
    @State private var healthKit = HealthKitManager.shared
    @State private var selectedMealForEntry: MealSlot? = nil
    @State private var isShowingWeeklyTrends: Bool = false
    @State private var expandedSlot: MealSlot? = nil
    
    private var profile: UserProfile {
        userProfiles.first ?? UserProfile()
    }
    
    private var todayLog: DailyLog {
        let calendar = Calendar.current
        let today = calendar.startOfDay(for: Date())
        if let existing = dailyLogs.first(where: { calendar.isDate($0.date, inSameDayAs: today) }) {
            return existing
        } else {
            let newLog = DailyLog(date: today)
            modelContext.insert(newLog)
            return newLog
        }
    }
    
    public var body: some View {
        NavigationStack {
            ZStack {
                Color.black.ignoresSafeArea()
                
                ScrollView(.vertical, showsIndicators: false) {
                    VStack(spacing: 22) {
                        // Header Section
                        HStack {
                            VStack(alignment: .leading, spacing: 4) {
                                Text(Date().formatted(.dateTime.weekday(.wide).month().day()))
                                    .font(.system(size: 13, weight: .semibold, design: .rounded))
                                    .foregroundStyle(.white.opacity(0.6))
                                    .textCase(.uppercase)
                                Text("Daily Balance")
                                    .font(.system(size: 28, weight: .bold, design: .rounded))
                                    .foregroundStyle(.white)
                            }
                            Spacer()
                            
                            Button {
                                isShowingWeeklyTrends = true
                                UIImpactFeedbackGenerator(style: .medium).impactOccurred()
                            } label: {
                                HStack(spacing: 6) {
                                    Image(systemName: "chart.bar.xaxis")
                                    Text("Trends")
                                }
                                .font(.system(size: 12, weight: .bold))
                                .foregroundStyle(Color(red: 0.39, green: 0.82, blue: 1.0))
                                .padding(.horizontal, 12)
                                .padding(.vertical, 7)
                                .background(.ultraThinMaterial, in: Capsule())
                                .overlay(Capsule().stroke(Color.cyan.opacity(0.3), lineWidth: 1))
                            }
                        }
                        
                        // Concentric Rings
                        ringsOverviewCard
                        
                        // Steps Card
                        StepProgressCard(
                            steps: max(healthKit.stepCount, todayLog.stepCount),
                            stepGoal: 10_000,
                            caloriesBurned: max(healthKit.activeCaloriesBurned, todayLog.activeCaloriesBurned),
                            onTapSync: { Task { await healthKit.requestAuthorization() } }
                        )
                        
                        // MARK: - HealthKit Hydration Card (+250ml, +500ml Quick-Add)
                        hydrationCard
                        
                        // Strictly 3 Meal Slots with Matched Geometry Transitions
                        mealSlotsSection
                    }
                    .padding(.horizontal, 20)
                    .padding(.bottom, 100)
                }
            }
            .navigationTitle("Today")
            .navigationBarTitleDisplayMode(.inline)
            .sheet(isPresented: $isShowingWeeklyTrends) {
                WeeklyTrendsView()
            }
            .sheet(item: $selectedMealForEntry) { slot in
                MealEntryView(slot: slot, log: todayLog)
            }
        }
    }
    
    // MARK: - Hydration Quick-Add Card
    private var hydrationCard: some View {
        GlassmorphicCard {
            VStack(spacing: 12) {
                HStack(spacing: 14) {
                    ZStack {
                        Circle()
                            .fill(Color.cyan.opacity(0.15))
                            .frame(width: 44, height: 44)
                        Image(systemName: "drop.fill")
                            .font(.system(size: 20))
                            .foregroundStyle(Color(red: 0.39, green: 0.82, blue: 1.0))
                    }
                    
                    VStack(alignment: .leading, spacing: 2) {
                        Text("DIETARY WATER")
                            .font(.system(size: 10, weight: .heavy))
                            .foregroundStyle(.white.opacity(0.5))
                        
                        HStack(alignment: .firstTextBaseline, spacing: 3) {
                            Text("\\(Int(healthKit.waterIntakeMl))")
                                .font(.system(size: 22, weight: .heavy, design: .rounded))
                                .foregroundStyle(.white)
                            Text("/ 2,500 ml")
                                .font(.system(size: 12, weight: .semibold, design: .monospaced))
                                .foregroundStyle(.white.opacity(0.5))
                        }
                    }
                    Spacer()
                    
                    // Quick add buttons writing to HealthKit
                    HStack(spacing: 8) {
                        waterButton(label: "+250ml", ml: 250)
                        waterButton(label: "+500ml", ml: 500)
                    }
                }
            }
            .padding(16)
        }
    }
    
    private func waterButton(label: String, ml: Double) -> some View {
        Button {
            UIImpactFeedbackGenerator(style: .medium).impactOccurred()
            Task {
                try? await healthKit.addWaterIntake(milliliters: ml)
            }
        } label: {
            Text(label)
                .font(.system(size: 12, weight: .bold))
                .foregroundStyle(Color(red: 0.39, green: 0.82, blue: 1.0))
                .padding(.horizontal, 10)
                .padding(.vertical, 7)
                .background(Color.cyan.opacity(0.12), in: RoundedRectangle(cornerRadius: 10))
                .overlay(RoundedRectangle(cornerRadius: 10).stroke(Color.cyan.opacity(0.3), lineWidth: 1))
        }
        .buttonStyle(ScaleButtonStyle())
    }
    
    // MARK: - Meal Slots with Hero Matched Geometry
    private var mealSlotsSection: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("Meals (3 Slots)")
                .font(.system(size: 18, weight: .bold, design: .rounded))
                .foregroundStyle(.white)
            
            ForEach(MealSlot.allCases) { slot in
                let meals = todayLog.meals(for: slot)
                let slotCalories = todayLog.calories(for: slot)
                let isExpanded = expandedSlot == slot
                
                GlassmorphicCard {
                    VStack(alignment: .leading, spacing: 12) {
                        HStack {
                            Image(systemName: slot.iconName)
                                .foregroundStyle(Color(red: 1.0, green: 0.84, blue: 0.04))
                            Text(slot.rawValue)
                                .font(.system(size: 16, weight: .bold, design: .rounded))
                                .foregroundStyle(.white)
                                .matchedGeometryEffect(id: "title_\\(slot.rawValue)", in: heroNamespace)
                            
                            Spacer()
                            
                            Text("\\(Int(slotCalories)) kcal")
                                .font(.system(size: 14, weight: .heavy, design: .monospaced))
                                .foregroundStyle(.white.opacity(0.8))
                            
                            Button {
                                selectedMealForEntry = slot
                            } label: {
                                Image(systemName: "plus.circle.fill")
                                    .font(.system(size: 22))
                                    .foregroundStyle(Color(red: 0.19, green: 0.82, blue: 0.35))
                            }
                            .buttonStyle(ScaleButtonStyle())
                        }
                        
                        if meals.isEmpty {
                            Text("No items logged yet")
                                .font(.system(size: 12))
                                .foregroundStyle(.white.opacity(0.35))
                        } else {
                            VStack(spacing: 8) {
                                ForEach(meals) { item in
                                    HStack {
                                        Text(item.name).font(.system(size: 13, weight: .medium)).foregroundStyle(.white)
                                        Spacer()
                                        Text("P:\\(Int(item.proteinGrams))g C:\\(Int(item.carbsGrams))g F:\\(Int(item.fatGrams))g")
                                            .font(.system(size: 11, design: .monospaced))
                                            .foregroundStyle(.white.opacity(0.4))
                                    }
                                    .transition(.scale.combined(with: .opacity))
                                }
                            }
                            .animation(.spring(response: 0.4, dampingFraction: 0.7), value: meals.count)
                        }
                    }
                    .padding(16)
                }
                .onTapGesture {
                    withAnimation(.spring(response: 0.4, dampingFraction: 0.7)) {
                        expandedSlot = (expandedSlot == slot) ? nil : slot
                    }
                }
            }
        }
    }
    
    private var ringsOverviewCard: some View {
        GlassmorphicCard {
            VStack(spacing: 16) {
                HStack(spacing: 24) {
                    ConcentricRingsView(
                        proteinRatio: todayLog.totalProteinGrams / max(1, profile.macroTargets.proteinGrams),
                        carbsRatio: todayLog.totalCarbsGrams / max(1, profile.macroTargets.carbsGrams),
                        fatRatio: todayLog.totalFatGrams / max(1, profile.macroTargets.fatGrams),
                        size: 140
                    )
                    VStack(alignment: .leading, spacing: 10) {
                        legend("Protein", current: todayLog.totalProteinGrams, target: profile.macroTargets.proteinGrams, color: Color(red: 0.19, green: 0.82, blue: 0.35))
                        legend("Carbs", current: todayLog.totalCarbsGrams, target: profile.macroTargets.carbsGrams, color: Color(red: 0.39, green: 0.82, blue: 1.0))
                        legend("Fats", current: todayLog.totalFatGrams, target: profile.macroTargets.fatGrams, color: Color(red: 0.75, green: 0.35, blue: 0.95))
                    }
                }
            }
            .padding(18)
        }
    }
    
    private func legend(_ label: String, current: Double, target: Double, color: Color) -> some View {
        HStack(spacing: 8) {
            Circle().fill(color).frame(width: 8, height: 8).shadow(color: color.opacity(0.5), radius: 4)
            Text(label).font(.system(size: 12, weight: .semibold)).foregroundStyle(.white)
            Spacer()
            Text("\\(Int(current))/\\(Int(target))g").font(.system(size: 11, design: .monospaced)).foregroundStyle(.white.opacity(0.5))
        }
    }
}

/// iOS 27 Scale Effect ButtonStyle
public struct ScaleButtonStyle: ButtonStyle {
    public func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.95 : 1.0)
            .animation(.spring(response: 0.4, dampingFraction: 0.7), value: configuration.isPressed)
    }
}
`,
  },
  {
    id: 'user-profile-model',
    filename: 'UserProfile.swift',
    path: 'Models/UserProfile.swift',
    category: 'Models',
    description: 'SwiftData Model storing persistent user metrics and metabolic requirements.',
    code: `//
//  UserProfile.swift
//  PulseTrack (iPhone 16 / iOS 27 Target)
//

import Foundation
import SwiftData

public enum BiologicalGender: String, Codable, CaseIterable, Identifiable {
    case male = "Male"
    case female = "Female"
    case other = "Other"
    public var id: String { rawValue }
}

public enum ActivityLevel: String, Codable, CaseIterable, Identifiable {
    case sedentary = "Sedentary"
    case lightlyActive = "Lightly Active"
    case moderatelyActive = "Moderately Active"
    case veryActive = "Very Active"
    case extraActive = "Athlete"
    public var id: String { rawValue }
    
    public var multiplier: Double {
        switch self {
        case .sedentary: return 1.2
        case .lightlyActive: return 1.375
        case .moderatelyActive: return 1.55
        case .veryActive: return 1.725
        case .extraActive: return 1.9
        }
    }
}

public enum FitnessGoal: String, Codable, CaseIterable, Identifiable {
    case fatLoss = "Fat Loss (-500 kcal)"
    case maintenance = "Maintenance (0 kcal)"
    case muscleGain = "Lean Bulk (+350 kcal)"
    public var id: String { rawValue }
    
    public var calorieAdjustment: Double {
        switch self {
        case .fatLoss: return -500.0
        case .maintenance: return 0.0
        case .muscleGain: return 350.0
        }
    }
}

@Model
public final class UserProfile {
    @Attribute(.unique) public var id: UUID
    public var heightCm: Double
    public var weightKg: Double
    public var age: Int
    public var genderRaw: String
    public var activityLevelRaw: String
    public var fitnessGoalRaw: String
    public var createdAt: Date
    public var updatedAt: Date
    
    @Relationship(deleteRule: .cascade, inverse: \\DailyLog.userProfile)
    public var dailyLogs: [DailyLog] = []

    public init(
        id: UUID = UUID(),
        heightCm: Double = 178.0,
        weightKg: Double = 75.0,
        age: Int = 28,
        gender: BiologicalGender = .male,
        activityLevel: ActivityLevel = .moderatelyActive,
        goal: FitnessGoal = .maintenance
    ) {
        self.id = id
        self.heightCm = heightCm
        self.weightKg = weightKg
        self.age = age
        self.genderRaw = gender.rawValue
        self.activityLevelRaw = activityLevel.rawValue
        self.fitnessGoalRaw = goal.rawValue
        self.createdAt = Date()
        self.updatedAt = Date()
    }
    
    public var bmr: Double {
        NutritionCalculator.calculateBMR(weightKg: weightKg, heightCm: heightCm, ageYears: age, gender: BiologicalGender(rawValue: genderRaw) ?? .male)
    }
    public var tdee: Double {
        NutritionCalculator.calculateTDEE(bmr: bmr, activityLevel: ActivityLevel(rawValue: activityLevelRaw) ?? .moderatelyActive)
    }
    public var dailyCalorieTarget: Double {
        max(1200.0, tdee + (FitnessGoal(rawValue: fitnessGoalRaw) ?? .maintenance).calorieAdjustment)
    }
    public var macroTargets: MacroTargets {
        NutritionCalculator.calculateMacros(weightKg: weightKg, targetCalories: dailyCalorieTarget)
    }
}
`,
  },
  {
    id: 'daily-log-model',
    filename: 'DailyLog.swift',
    path: 'Models/DailyLog.swift',
    category: 'Models',
    description: 'SwiftData Model holding daily aggregated logs, steps, and linked meal entries.',
    code: `//
//  DailyLog.swift
//  PulseTrack
//

import Foundation
import SwiftData

@Model
public final class DailyLog {
    @Attribute(.unique) public var id: UUID
    public var date: Date
    public var stepCount: Int
    public var activeCaloriesBurned: Double
    public var waterIntakeMl: Double
    
    public var userProfile: UserProfile?
    
    @Relationship(deleteRule: .cascade, inverse: \\MealEntry.dailyLog)
    public var meals: [MealEntry] = []
    
    public init(
        id: UUID = UUID(),
        date: Date = Calendar.current.startOfDay(for: Date()),
        stepCount: Int = 0,
        activeCaloriesBurned: Double = 0.0,
        waterIntakeMl: Double = 0.0
    ) {
        self.id = id
        self.date = date
        self.stepCount = stepCount
        self.activeCaloriesBurned = activeCaloriesBurned
        self.waterIntakeMl = waterIntakeMl
    }
    
    public var totalCaloriesConsumed: Double { meals.reduce(0.0) { $0 + $1.calories } }
    public var totalProteinGrams: Double { meals.reduce(0.0) { $0 + $1.proteinGrams } }
    public var totalCarbsGrams: Double { meals.reduce(0.0) { $0 + $1.carbsGrams } }
    public var totalFatGrams: Double { meals.reduce(0.0) { $0 + $1.fatGrams } }
    
    public func meals(for slot: MealSlot) -> [MealEntry] { meals.filter { $0.slot == slot } }
    public func calories(for slot: MealSlot) -> Double { meals(for: slot).reduce(0.0) { $0 + $1.calories } }
}
`,
  },
  {
    id: 'meal-entry-model',
    filename: 'MealEntry.swift',
    path: 'Models/MealEntry.swift',
    category: 'Models',
    description: 'SwiftData Model strictly enforcing 3 meal categories: Breakfast, Lunch, Dinner.',
    code: `//
//  MealEntry.swift
//  PulseTrack
//

import Foundation
import SwiftData

public enum MealSlot: String, Codable, CaseIterable, Identifiable {
    case breakfast = "Breakfast"
    case lunch = "Lunch"
    case dinner = "Dinner"
    public var id: String { rawValue }
    public var iconName: String {
        switch self {
        case .breakfast: return "sun.horizon.fill"
        case .lunch: return "sun.max.fill"
        case .dinner: return "moon.stars.fill"
        }
    }
}

@Model
public final class MealEntry {
    @Attribute(.unique) public var id: UUID
    public var name: String
    public var slotRaw: String
    public var calories: Double
    public var proteinGrams: Double
    public var carbsGrams: Double
    public var fatGrams: Double
    public var timestamp: Date
    public var dailyLog: DailyLog?
    
    public init(
        id: UUID = UUID(),
        name: String,
        slot: MealSlot,
        calories: Double,
        proteinGrams: Double,
        carbsGrams: Double,
        fatGrams: Double,
        timestamp: Date = Date()
    ) {
        self.id = id
        self.name = name
        self.slotRaw = slot.rawValue
        self.calories = calories
        self.proteinGrams = proteinGrams
        self.carbsGrams = carbsGrams
        self.fatGrams = fatGrams
        self.timestamp = timestamp
    }
    
    public var slot: MealSlot {
        get { MealSlot(rawValue: slotRaw) ?? .breakfast }
        set { slotRaw = newValue.rawValue }
    }
}
`,
  },
  {
    id: 'nutrition-calculator',
    filename: 'NutritionCalculator.swift',
    path: 'Services/NutritionCalculator.swift',
    category: 'Services',
    description: 'Clinical Mifflin-St Jeor formula, TDEE multiplier, and macro split calculator.',
    code: `//
//  NutritionCalculator.swift
//  PulseTrack
//

import Foundation

public struct MacroTargets: Equatable {
    public let calories: Double
    public let proteinGrams: Double
    public let carbsGrams: Double
    public let fatGrams: Double
}

public enum NutritionCalculator {
    public static func calculateBMR(weightKg: Double, heightCm: Double, ageYears: Int, gender: BiologicalGender) -> Double {
        guard weightKg > 0, heightCm > 0, ageYears > 0 else { return 0.0 }
        let base = (10.0 * weightKg) + (6.25 * heightCm) - (5.0 * Double(ageYears))
        switch gender {
        case .male: return round(base + 5.0)
        case .female: return round(base - 161.0)
        case .other: return round(base - 78.0)
        }
    }
    
    public static func calculateTDEE(bmr: Double, activityLevel: ActivityLevel) -> Double {
        round(bmr * activityLevel.multiplier)
    }
    
    public static func calculateMacros(weightKg: Double, targetCalories: Double) -> MacroTargets {
        var protein = min(max(weightKg * 2.0, (targetCalories * 0.20) / 4.0), (targetCalories * 0.35) / 4.0)
        var fat = min(max(weightKg * 0.9, (targetCalories * 0.20) / 9.0), (targetCalories * 0.30) / 9.0)
        let carbs = max(0.0, targetCalories - (protein * 4.0 + fat * 9.0)) / 4.0
        return MacroTargets(calories: round(targetCalories), proteinGrams: round(protein), carbsGrams: round(carbs), fatGrams: round(fat))
    }
}
`,
  },
  {
    id: 'app-entry-point',
    filename: 'PulseTrackApp.swift',
    path: 'App/PulseTrackApp.swift',
    category: 'App',
    description: 'Main SwiftUI App lifecycle configuring SwiftData ModelContainer for iPhone 16.',
    code: `//
//  PulseTrackApp.swift
//  PulseTrack
//

import SwiftUI
import SwiftData

@main
public struct PulseTrackApp: App {
    public var sharedModelContainer: ModelContainer = {
        let schema = Schema([UserProfile.self, DailyLog.self, MealEntry.self])
        return try! ModelContainer(for: schema, configurations: [ModelConfiguration(schema: schema)])
    }()
    
    public var body: some Scene {
        WindowGroup {
            ContentView()
                .preferredColorScheme(.dark)
        }
        .modelContainer(sharedModelContainer)
    }
}
`,
  },
];
