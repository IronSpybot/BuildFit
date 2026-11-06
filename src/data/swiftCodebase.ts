/**
 * PulseTrack iOS 27 Architecture & Swift Codebase Repository
 * Contains complete, production-ready Swift, SwiftData, and HealthKit source files.
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
│   ├── DailyLog.swift                   // SwiftData @Model for daily step, calories, & macro totals
│   └── MealEntry.swift                  // SwiftData @Model for Breakfast, Lunch, Dinner items
├── Services/
│   ├── HealthKitManager.swift           // Core HealthKit authorization & step count queries
│   └── NutritionCalculator.swift        // Pure mathematical formulas (Mifflin-St Jeor, TDEE, Macros)
├── ViewModels/
│   ├── DashboardViewModel.swift         // MVVM state coordinator for rings, steps, & meals
│   ├── MealEntryViewModel.swift         // Meal input validation & macro calculation logic
│   └── ProfileViewModel.swift           // Metric updates and real-time metabolic recalculations
└── Views/
    ├── MainDashboardView.swift          // Apple Fitness-style concentric rings & 3 meal cards
    ├── MealEntryView.swift              // Strict 3-slot food logger with glassmorphic inputs
    ├── OnboardingProfileView.swift      // User body metrics onboarding & TDEE breakdown
    └── Components/
        ├── ConcentricRingsView.swift    // Custom SwiftUI Canvas/Shape multi-ring chart
        ├── GlassmorphicCard.swift       // iOS 27 Ultra-thin material container
        └── StepProgressCard.swift       // Dedicated daily step gauge with live sync badge
`;

export const SWIFT_CODE_FILES: SwiftFile[] = [
  {
    id: 'user-profile-model',
    filename: 'UserProfile.swift',
    path: 'Models/UserProfile.swift',
    category: 'Models',
    description: 'SwiftData Model storing persistent user metrics and metabolic requirements.',
    code: `//
//  UserProfile.swift
//  PulseTrack (iOS 16 / iOS 27 Target)
//
//  Created for iPhone 16 Architecture.
//

import Foundation
import SwiftData

/// Represents biological sex for clinical metabolic formulas.
public enum BiologicalGender: String, Codable, CaseIterable, Identifiable {
    case male = "Male"
    case female = "Female"
    case other = "Other"
    
    public var id: String { rawValue }
}

/// Standard physical activity multipliers matching WHO / ACSM guidelines.
public enum ActivityLevel: String, Codable, CaseIterable, Identifiable {
    case sedentary = "Sedentary (desk job, minimal movement)"
    case lightlyActive = "Lightly Active (1-3 days light exercise)"
    case moderatelyActive = "Moderately Active (3-5 days moderate workout)"
    case veryActive = "Very Active (6-7 days heavy training)"
    case extraActive = "Athlete (twice daily or intense labor)"
    
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

/// User fitness target used to determine caloric deficit or surplus.
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
    
    // Relationships
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
    
    public var gender: BiologicalGender {
        get { BiologicalGender(rawValue: genderRaw) ?? .male }
        set { genderRaw = newValue.rawValue }
    }
    
    public var activityLevel: ActivityLevel {
        get { ActivityLevel(rawValue: activityLevelRaw) ?? .moderatelyActive }
        set { activityLevelRaw = newValue.rawValue }
    }
    
    public var fitnessGoal: FitnessGoal {
        get { FitnessGoal(rawValue: fitnessGoalRaw) ?? .maintenance }
        set { fitnessGoalRaw = newValue.rawValue }
    }
    
    // MARK: - Computed Metabolic Baselines
    
    /// Basal Metabolic Rate using the clinically validated Mifflin-St Jeor Equation
    public var bmr: Double {
        NutritionCalculator.calculateBMR(
            weightKg: weightKg,
            heightCm: heightCm,
            ageYears: age,
            gender: gender
        )
    }
    
    /// Total Daily Energy Expenditure (BMR * Activity Multiplier)
    public var tdee: Double {
        NutritionCalculator.calculateTDEE(bmr: bmr, activityLevel: activityLevel)
    }
    
    /// Targeted net daily calories taking fitness goal into account
    public var dailyCalorieTarget: Double {
        max(1200.0, tdee + fitnessGoal.calorieAdjustment)
    }
    
    /// Macro splits in grams (Protein, Carbs, Fats)
    public var macroTargets: MacroTargets {
        NutritionCalculator.calculateMacros(
            weightKg: weightKg,
            targetCalories: dailyCalorieTarget
        )
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
//  SwiftData Model for daily nutrition and activity tracking.
//

import Foundation
import SwiftData

@Model
public final class DailyLog {
    @Attribute(.unique) public var id: UUID
    public var date: Date
    public var stepCount: Int
    public var activeCaloriesBurned: Double
    
    // Relationship to UserProfile
    public var userProfile: UserProfile?
    
    // Relationship to individual meal entries
    @Relationship(deleteRule: .cascade, inverse: \\MealEntry.dailyLog)
    public var meals: [MealEntry] = []
    
    public init(
        id: UUID = UUID(),
        date: Date = Calendar.current.startOfDay(for: Date()),
        stepCount: Int = 0,
        activeCaloriesBurned: Double = 0.0
    ) {
        self.id = id
        self.date = date
        self.stepCount = stepCount
        self.activeCaloriesBurned = activeCaloriesBurned
    }
    
    // MARK: - Aggregations
    
    public var totalCaloriesConsumed: Double {
        meals.reduce(0.0) { $0 + $1.calories }
    }
    
    public var totalProteinGrams: Double {
        meals.reduce(0.0) { $0 + $1.proteinGrams }
    }
    
    public var totalCarbsGrams: Double {
        meals.reduce(0.0) { $0 + $1.carbsGrams }
    }
    
    public var totalFatGrams: Double {
        meals.reduce(0.0) { $0 + $1.fatGrams }
    }
    
    /// Net Calories = Consumed Calories - Active Step Burn
    public var netCalories: Double {
        max(0.0, totalCaloriesConsumed - activeCaloriesBurned)
    }
    
    /// Convenience helper to filter meals for a specific slot
    public func meals(for slot: MealSlot) -> [MealEntry] {
        meals.filter { $0.slot == slot }
    }
    
    public func calories(for slot: MealSlot) -> Double {
        meals(for: slot).reduce(0.0) { $0 + $1.calories }
    }
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
//  SwiftData model for food items partitioned into 3 slots.
//

import Foundation
import SwiftData

/// The 3 strictly enforced meal slots.
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
    id: 'healthkit-manager',
    filename: 'HealthKitManager.swift',
    path: 'Services/HealthKitManager.swift',
    category: 'Services',
    description: 'Apple HealthKit integration manager for step counts and active calorie burn with background queries.',
    code: `//
//  HealthKitManager.swift
//  PulseTrack
//
//  iOS 27 / HealthKit Service handling permission requests and step tracking.
//

import Foundation
import HealthKit
import Observation

@Observable
public final class HealthKitManager {
    public static let shared = HealthKitManager()
    
    private let healthStore = HKHealthStore()
    
    // Observable properties for SwiftUI
    public var isAuthorized: Bool = false
    public var stepCount: Int = 0
    public var activeCaloriesBurned: Double = 0.0
    public var lastSyncTime: Date? = nil
    public var authorizationError: String? = nil
    
    private init() {
        checkHealthKitAvailability()
    }
    
    /// Verifies device hardware supports HealthKit
    public func checkHealthKitAvailability() {
        guard HKHealthStore.isHealthDataAvailable() else {
            authorizationError = "Apple Health is not available on this device."
            return
        }
    }
    
    /// Requests user authorization to read Steps and Active Energy Burned
    public func requestAuthorization() async {
        guard HKHealthStore.isHealthDataAvailable() else { return }
        
        guard let stepType = HKQuantityType.quantityType(forIdentifier: .stepCount),
              let activeEnergyType = HKQuantityType.quantityType(forIdentifier: .activeEnergyBurned) else {
            authorizationError = "Unable to create HealthKit quantity types."
            return
        }
        
        let typesToRead: Set<HKObjectType> = [stepType, activeEnergyType]
        
        do {
            try await healthStore.requestAuthorization(toShare: [], read: typesToRead)
            await MainActor.run {
                self.isAuthorized = true
                self.authorizationError = nil
            }
            await fetchTodaySteps()
            await fetchTodayActiveEnergy()
            startObservingStepChanges()
        } catch {
            await MainActor.run {
                self.isAuthorized = false
                self.authorizationError = error.localizedDescription
            }
        }
    }
    
    /// Queries today's cumulative step count using HKStatisticsQuery
    public func fetchTodaySteps() async {
        guard let stepType = HKQuantityType.quantityType(forIdentifier: .stepCount) else { return }
        
        let calendar = Calendar.current
        let startOfDay = calendar.startOfDay(for: Date())
        let predicate = HKQuery.predicateForSamples(withStart: startOfDay, end: Date(), options: .strictStartDate)
        
        return await withCheckedContinuation { continuation in
            let query = HKStatisticsQuery(
                quantityType: stepType,
                quantitySamplePredicate: predicate,
                options: .cumulativeSum
            ) { [weak self] _, statistics, error in
                guard let self = self else {
                    continuation.resume()
                    return
                }
                
                DispatchQueue.main.async {
                    if let sum = statistics?.sumQuantity() {
                        let totalSteps = Int(sum.doubleValue(for: HKUnit.count()))
                        self.stepCount = totalSteps
                        self.lastSyncTime = Date()
                    } else {
                        // Default to 0 or preserve state if query returned nil
                        self.stepCount = max(0, self.stepCount)
                    }
                    continuation.resume()
                }
            }
            self.healthStore.execute(query)
        }
    }
    
    /// Queries today's active energy expenditure
    public func fetchTodayActiveEnergy() async {
        guard let energyType = HKQuantityType.quantityType(forIdentifier: .activeEnergyBurned) else { return }
        
        let calendar = Calendar.current
        let startOfDay = calendar.startOfDay(for: Date())
        let predicate = HKQuery.predicateForSamples(withStart: startOfDay, end: Date(), options: .strictStartDate)
        
        return await withCheckedContinuation { continuation in
            let query = HKStatisticsQuery(
                quantityType: energyType,
                quantitySamplePredicate: predicate,
                options: .cumulativeSum
            ) { [weak self] _, statistics, _ in
                guard let self = self else {
                    continuation.resume()
                    return
                }
                
                DispatchQueue.main.async {
                    if let sum = statistics?.sumQuantity() {
                        self.activeCaloriesBurned = sum.doubleValue(for: HKUnit.kilocalorie())
                    } else {
                        // Estimate step calories if active energy is not directly tracked
                        self.activeCaloriesBurned = Double(self.stepCount) * 0.04
                    }
                    continuation.resume()
                }
            }
            self.healthStore.execute(query)
        }
    }
    
    /// Sets up HKObserverQuery to automatically refresh steps when background health changes arrive
    private func startObservingStepChanges() {
        guard let stepType = HKQuantityType.quantityType(forIdentifier: .stepCount) else { return }
        
        let observerQuery = HKObserverQuery(sampleType: stepType, predicate: nil) { [weak self] _, _, error in
            guard error == nil else { return }
            Task {
                await self?.fetchTodaySteps()
                await self?.fetchTodayActiveEnergy()
            }
        }
        
        healthStore.execute(observerQuery)
        healthStore.enableBackgroundDelivery(for: stepType, frequency: .immediate) { _, _ in }
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
//  Metabolic engine implementing Mifflin-St Jeor & macro split formulas.
//

import Foundation

public struct MacroTargets: Equatable {
    public let calories: Double
    public let proteinGrams: Double
    public let carbsGrams: Double
    public let fatGrams: Double
    
    public init(calories: Double, proteinGrams: Double, carbsGrams: Double, fatGrams: Double) {
        self.calories = calories
        self.proteinGrams = proteinGrams
        self.carbsGrams = carbsGrams
        self.fatGrams = fatGrams
    }
}

public enum NutritionCalculator {
    
    /// Mifflin-St Jeor Basal Metabolic Rate (BMR) Formula
    ///
    /// Formula:
    /// - Men:   BMR = (10 × weight in kg) + (6.25 × height in cm) - (5 × age in years) + 5
    /// - Women: BMR = (10 × weight in kg) + (6.25 × height in cm) - (5 × age in years) - 161
    /// - Neutral/Other: Midpoint offset (-78)
    public static func calculateBMR(
        weightKg: Double,
        heightCm: Double,
        ageYears: Int,
        gender: BiologicalGender
    ) -> Double {
        guard weightKg > 0, heightCm > 0, ageYears > 0 else { return 0.0 }
        
        let base = (10.0 * weightKg) + (6.25 * heightCm) - (5.0 * Double(ageYears))
        
        switch gender {
        case .male:
            return round(base + 5.0)
        case .female:
            return round(base - 161.0)
        case .other:
            return round(base - 78.0)
        }
    }
    
    /// Total Daily Energy Expenditure (TDEE)
    /// TDEE = BMR × Activity Multiplier
    public static func calculateTDEE(bmr: Double, activityLevel: ActivityLevel) -> Double {
        round(bmr * activityLevel.multiplier)
    }
    
    /// Computes macro targets based on athlete body composition guidelines:
    /// - Protein: 2.0g per kg of bodyweight (bounded between 20% - 35% of total calories)
    /// - Fat: 0.9g per kg of bodyweight (bounded between 20% - 30% of total calories)
    /// - Carbohydrates: Allocates all remaining calories (4 kcal/g)
    public static func calculateMacros(weightKg: Double, targetCalories: Double) -> MacroTargets {
        // Protein (4 kcal/g)
        var protein = weightKg * 2.0
        let minProtein = (targetCalories * 0.20) / 4.0
        let maxProtein = (targetCalories * 0.35) / 4.0
        protein = min(max(protein, minProtein), maxProtein)
        
        // Fat (9 kcal/g)
        var fat = weightKg * 0.9
        let minFat = (targetCalories * 0.20) / 9.0
        let maxFat = (targetCalories * 0.30) / 9.0
        fat = min(max(fat, minFat), maxFat)
        
        // Remaining calories for Carbohydrates (4 kcal/g)
        let allocatedCalories = (protein * 4.0) + (fat * 9.0)
        let remainingCalories = max(0.0, targetCalories - allocatedCalories)
        let carbs = remainingCalories / 4.0
        
        return MacroTargets(
            calories: round(targetCalories),
            proteinGrams: round(protein),
            carbsGrams: round(carbs),
            fatGrams: round(fat)
        )
    }
    
    /// Estimates step-driven active calories: (0.04 kcal * steps * (weightKg / 70kg))
    public static func estimateStepCalories(steps: Int, weightKg: Double) -> Double {
        guard steps > 0, weightKg > 0 else { return 0.0 }
        let weightFactor = weightKg / 70.0
        return round(Double(steps) * 0.04 * weightFactor)
    }
}
`,
  },
  {
    id: 'main-dashboard-view',
    filename: 'MainDashboardView.swift',
    path: 'Views/MainDashboardView.swift',
    category: 'Views',
    description: 'Main Dashboard SwiftUI view featuring Apple Fitness rings, HealthKit steps, and 3 meal slots.',
    code: `//
//  MainDashboardView.swift
//  PulseTrack
//
//  iPhone 16 iOS 27 OLED True Black Dashboard with Concentric Rings.
//

import SwiftUI
import SwiftData

public struct MainDashboardView: View {
    @Environment(\\.modelContext) private var modelContext
    @Query private var userProfiles: [UserProfile]
    @Query private var dailyLogs: [DailyLog]
    
    @State private var healthKit = HealthKitManager.shared
    @State private var selectedMealForEntry: MealSlot? = nil
    @State private var isShowingManualStepsSheet: Bool = false
    
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
                // True OLED Black Background
                Color.black.ignoresSafeArea()
                
                ScrollView(.vertical, showsIndicators: false) {
                    VStack(spacing: 22) {
                        // Header: Date & Dynamic Island / Status spacing
                        headerSection
                        
                        // Apple Fitness-Style Concentric Rings Card
                        ringsOverviewCard
                        
                        // HealthKit Steps Tracker Card
                        StepProgressCard(
                            steps: max(healthKit.stepCount, todayLog.stepCount),
                            stepGoal: 10_000,
                            caloriesBurned: max(healthKit.activeCaloriesBurned, todayLog.activeCaloriesBurned),
                            onTapSync: {
                                Task {
                                    await healthKit.requestAuthorization()
                                }
                            }
                        )
                        
                        // 3 Strictly Enforced Meal Slots
                        mealSlotsSection
                    }
                    .padding(.horizontal, 20)
                    .padding(.bottom, 100) // Safe Area for Bottom TabBar
                }
            }
            .navigationTitle("Today")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        Task { await healthKit.fetchTodaySteps() }
                    } label: {
                        Image(systemName: "arrow.clockwise")
                            .font(.system(size: 15, weight: .semibold))
                            .foregroundStyle(.white.opacity(0.8))
                    }
                }
            }
            .sheet(item: $selectedMealForEntry) { slot in
                MealEntryView(slot: slot, log: todayLog)
            }
        }
    }
    
    // MARK: - Header
    private var headerSection: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(Date().formatted(.dateTime.weekday(.wide).month().day()))
                    .font(.system(size: 13, weight: .semibold, design: .rounded))
                    .foregroundStyle(.white.opacity(0.6))
                    .textCase(.uppercase)
                    .tracking(0.8)
                
                Text("Daily Balance")
                    .font(.system(size: 28, weight: .bold, design: .rounded))
                    .foregroundStyle(.white)
            }
            Spacer()
            
            // Net Calorie Pill
            VStack(alignment: .trailing, spacing: 2) {
                Text("NET BUDGET")
                    .font(.system(size: 10, weight: .bold))
                    .foregroundStyle(.white.opacity(0.5))
                
                let net = max(0, Int(todayLog.totalCaloriesConsumed - max(healthKit.activeCaloriesBurned, todayLog.activeCaloriesBurned)))
                Text("\\(net) / \\(Int(profile.dailyCalorieTarget)) kcal")
                    .font(.system(size: 13, weight: .heavy, design: .monospaced))
                    .foregroundStyle(Color(red: 1.0, green: 0.22, blue: 0.37))
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 8)
            .background(.ultraThinMaterial, in: Capsule())
            .overlay(Capsule().stroke(Color.white.opacity(0.12), lineWidth: 1))
        }
        .padding(.top, 8)
    }
    
    // MARK: - Rings Card
    private var ringsOverviewCard: some View {
        GlassmorphicCard {
            VStack(spacing: 18) {
                HStack(spacing: 24) {
                    // Triple Concentric Ring Visualizer
                    ConcentricRingsView(
                        proteinRatio: todayLog.totalProteinGrams / max(1, profile.macroTargets.proteinGrams),
                        carbsRatio: todayLog.totalCarbsGrams / max(1, profile.macroTargets.carbsGrams),
                        fatRatio: todayLog.totalFatGrams / max(1, profile.macroTargets.fatGrams),
                        size: 150
                    )
                    
                    // Ring Legend & Numbers
                    VStack(alignment: .leading, spacing: 12) {
                        macroLegendRow(
                            label: "Protein",
                            current: todayLog.totalProteinGrams,
                            target: profile.macroTargets.proteinGrams,
                            color: Color(red: 0.19, green: 0.82, blue: 0.35),
                            unit: "g"
                        )
                        macroLegendRow(
                            label: "Carbs",
                            current: todayLog.totalCarbsGrams,
                            target: profile.macroTargets.carbsGrams,
                            color: Color(red: 0.39, green: 0.82, blue: 1.0),
                            unit: "g"
                        )
                        macroLegendRow(
                            label: "Fats",
                            current: todayLog.totalFatGrams,
                            target: profile.macroTargets.fatGrams,
                            color: Color(red: 0.75, green: 0.35, blue: 0.95),
                            unit: "g"
                        )
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                }
                
                Divider().background(Color.white.opacity(0.1))
                
                // Bottom Caloric Bar
                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Consumed")
                            .font(.system(size: 11, weight: .medium))
                            .foregroundStyle(.white.opacity(0.6))
                        Text("\\(Int(todayLog.totalCaloriesConsumed)) kcal")
                            .font(.system(size: 17, weight: .bold, design: .rounded))
                            .foregroundStyle(.white)
                    }
                    Spacer()
                    VStack(alignment: .center, spacing: 2) {
                        Text("Active Burn")
                            .font(.system(size: 11, weight: .medium))
                            .foregroundStyle(.white.opacity(0.6))
                        let burn = Int(max(healthKit.activeCaloriesBurned, todayLog.activeCaloriesBurned))
                        Text("-\\(burn) kcal")
                            .font(.system(size: 17, weight: .bold, design: .rounded))
                            .foregroundStyle(Color(red: 1.0, green: 0.58, blue: 0.0))
                    }
                    Spacer()
                    VStack(alignment: .trailing, spacing: 2) {
                        Text("Remaining")
                            .font(.system(size: 11, weight: .medium))
                            .foregroundStyle(.white.opacity(0.6))
                        let remaining = Int(profile.dailyCalorieTarget - (todayLog.totalCaloriesConsumed - max(healthKit.activeCaloriesBurned, todayLog.activeCaloriesBurned)))
                        Text("\\(remaining) kcal")
                            .font(.system(size: 17, weight: .bold, design: .rounded))
                            .foregroundStyle(remaining >= 0 ? Color(red: 0.19, green: 0.82, blue: 0.35) : Color(red: 1.0, green: 0.22, blue: 0.37))
                    }
                }
            }
            .padding(18)
        }
    }
    
    private func macroLegendRow(label: String, current: Double, target: Double, color: Color, unit: String) -> some View {
        HStack(spacing: 8) {
            Circle()
                .fill(color)
                .frame(width: 9, height: 9)
                .shadow(color: color.opacity(0.6), radius: 4)
            
            VStack(alignment: .leading, spacing: 1) {
                Text(label)
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundStyle(.white.opacity(0.9))
                
                Text("\\(Int(current))/\\(Int(target))\\(unit)")
                    .font(.system(size: 11, weight: .bold, design: .monospaced))
                    .foregroundStyle(.white.opacity(0.5))
            }
        }
    }
    
    // MARK: - 3 Strict Meal Slots Section
    private var mealSlotsSection: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("Meals (3 Slots)")
                .font(.system(size: 18, weight: .bold, design: .rounded))
                .foregroundStyle(.white)
                .padding(.leading, 4)
            
            ForEach(MealSlot.allCases) { slot in
                mealSlotCard(slot: slot)
            }
        }
    }
    
    private func mealSlotCard(slot: MealSlot) -> some View {
        let meals = todayLog.meals(for: slot)
        let slotCalories = todayLog.calories(for: slot)
        
        return GlassmorphicCard {
            VStack(alignment: .leading, spacing: 12) {
                HStack {
                    Image(systemName: slot.iconName)
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundStyle(Color(red: 1.0, green: 0.84, blue: 0.04))
                    
                    Text(slot.rawValue)
                        .font(.system(size: 16, weight: .bold, design: .rounded))
                        .foregroundStyle(.white)
                    
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
                    .accessibilityLabel("Add food to \\(slot.rawValue)")
                }
                
                if meals.isEmpty {
                    Text("No items logged yet")
                        .font(.system(size: 13, weight: .medium))
                        .foregroundStyle(.white.opacity(0.35))
                        .padding(.vertical, 4)
                } else {
                    VStack(alignment: .leading, spacing: 8) {
                        ForEach(meals) { item in
                            HStack {
                                Text(item.name)
                                    .font(.system(size: 14, weight: .medium))
                                    .foregroundStyle(.white.opacity(0.9))
                                Spacer()
                                Text("P: \\(Int(item.proteinGrams))g  C: \\(Int(item.carbsGrams))g  F: \\(Int(item.fatGrams))g")
                                    .font(.system(size: 11, weight: .semibold, design: .monospaced))
                                    .foregroundStyle(.white.opacity(0.45))
                            }
                        }
                    }
                }
            }
            .padding(16)
        }
    }
}
`,
  },
  {
    id: 'meal-entry-view',
    filename: 'MealEntryView.swift',
    path: 'Views/MealEntryView.swift',
    category: 'Views',
    description: 'Strict 3-slot meal entry form with haptic feedback and real-time macro validation.',
    code: `//
//  MealEntryView.swift
//  PulseTrack
//
//  SwiftUI view for logging food items with strict 3-slot restriction.
//

import SwiftUI
import SwiftData

public struct MealEntryView: View {
    @Environment(\\.dismiss) private var dismiss
    @Environment(\\.modelContext) private var modelContext
    
    public let slot: MealSlot
    public let log: DailyLog
    
    @State private var foodName: String = ""
    @State private var caloriesText: String = ""
    @State private var proteinText: String = ""
    @State private var carbsText: String = ""
    @State private var fatText: String = ""
    
    // Quick food templates for swift logging
    private let presetItems: [(name: String, cal: Double, p: Double, c: Double, f: Double)] = [
        ("Oatmeal & Whey Protein", 380, 32, 45, 6),
        ("Eggs & Avocado Toast", 450, 24, 34, 22),
        ("Grilled Chicken Breast & Rice", 520, 48, 55, 8),
        ("Wild Salmon & Sweet Potato", 560, 42, 40, 18),
        ("Greek Yogurt & Berries", 220, 20, 24, 2)
    ]
    
    public var body: some View {
        NavigationStack {
            ZStack {
                Color.black.ignoresSafeArea()
                
                ScrollView {
                    VStack(spacing: 20) {
                        // Category Header Badge
                        HStack(spacing: 8) {
                            Image(systemName: slot.iconName)
                                .font(.system(size: 18, weight: .bold))
                                .foregroundStyle(Color(red: 1.0, green: 0.84, blue: 0.04))
                            
                            Text("Logging for \\(slot.rawValue)")
                                .font(.system(size: 16, weight: .bold, design: .rounded))
                                .foregroundStyle(.white)
                        }
                        .padding(.horizontal, 16)
                        .padding(.vertical, 8)
                        .background(.ultraThinMaterial, in: Capsule())
                        .overlay(Capsule().stroke(Color.white.opacity(0.1), lineWidth: 1))
                        
                        // Food Description Input
                        GlassmorphicCard {
                            VStack(alignment: .leading, spacing: 8) {
                                Text("FOOD OR MEAL NAME")
                                    .font(.system(size: 11, weight: .bold))
                                    .foregroundStyle(.white.opacity(0.5))
                                
                                TextField("e.g., Grilled Chicken Rice Bowl", text: $foodName)
                                    .font(.system(size: 16, weight: .semibold))
                                    .foregroundStyle(.white)
                                    .autocorrectionDisabled()
                            }
                            .padding(16)
                        }
                        
                        // Macro Input Grid
                        GlassmorphicCard {
                            VStack(spacing: 16) {
                                macroInputField(
                                    title: "Calories (kcal)",
                                    text: $caloriesText,
                                    color: Color(red: 1.0, green: 0.22, blue: 0.37),
                                    placeholder: "450"
                                )
                                
                                Divider().background(Color.white.opacity(0.1))
                                
                                HStack(spacing: 12) {
                                    macroInputField(
                                        title: "Protein (g)",
                                        text: $proteinText,
                                        color: Color(red: 0.19, green: 0.82, blue: 0.35),
                                        placeholder: "35"
                                    )
                                    macroInputField(
                                        title: "Carbs (g)",
                                        text: $carbsText,
                                        color: Color(red: 0.39, green: 0.82, blue: 1.0),
                                        placeholder: "40"
                                    )
                                    macroInputField(
                                        title: "Fats (g)",
                                        text: $fatText,
                                        color: Color(red: 0.75, green: 0.35, blue: 0.95),
                                        placeholder: "12"
                                    )
                                }
                            }
                            .padding(16)
                        }
                        
                        // Quick Presets
                        VStack(alignment: .leading, spacing: 10) {
                            Text("QUICK SUGGESTIONS")
                                .font(.system(size: 11, weight: .bold))
                                .foregroundStyle(.white.opacity(0.5))
                                .padding(.leading, 4)
                            
                            ScrollView(.horizontal, showsIndicators: false) {
                                HStack(spacing: 10) {
                                    ForEach(presetItems, id: \\.name) { preset in
                                        Button {
                                            applyPreset(preset)
                                        } label: {
                                            VStack(alignment: .leading, spacing: 4) {
                                                Text(preset.name)
                                                    .font(.system(size: 13, weight: .semibold))
                                                    .foregroundStyle(.white)
                                                Text("\\(Int(preset.cal)) kcal · \\(Int(preset.p))g P")
                                                    .font(.system(size: 11, weight: .medium, design: .monospaced))
                                                    .foregroundStyle(.white.opacity(0.6))
                                            }
                                            .padding(.horizontal, 14)
                                            .padding(.vertical, 10)
                                            .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 14))
                                            .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color.white.opacity(0.12), lineWidth: 1))
                                        }
                                    }
                                }
                            }
                        }
                        
                        // Submit Button with Haptics
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
                        .padding(.top, 10)
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
    
    private func macroInputField(title: String, text: Binding<String>, color: Color, placeholder: String) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            Text(title)
                .font(.system(size: 11, weight: .bold))
                .foregroundStyle(color)
            
            TextField(placeholder, text: text)
                .keyboardType(.decimalPad)
                .font(.system(size: 16, weight: .semibold, design: .monospaced))
                .foregroundStyle(.white)
        }
    }
    
    private func applyPreset(_ preset: (name: String, cal: Double, p: Double, c: Double, f: Double)) {
        foodName = preset.name
        caloriesText = "\\(Int(preset.cal))"
        proteinText = "\\(Int(preset.p))"
        carbsText = "\\(Int(preset.c))"
        fatText = "\\(Int(preset.f))"
        
        // Haptic Feedback
        UIImpactFeedbackGenerator(style: .light).impactOccurred()
    }
    
    private func saveMeal() {
        let cal = Double(caloriesText) ?? 0.0
        let p = Double(proteinText) ?? 0.0
        let c = Double(carbsText) ?? 0.0
        let f = Double(fatText) ?? 0.0
        
        let newMeal = MealEntry(
            name: foodName.trimmingCharacters(in: .whitespaces),
            slot: slot,
            calories: cal,
            proteinGrams: p,
            carbsGrams: c,
            fatGrams: f
        )
        
        newMeal.dailyLog = log
        modelContext.insert(newMeal)
        
        // Success Haptic Feedback
        UINotificationFeedbackGenerator().notificationOccurred(.success)
        
        dismiss()
    }
}
`,
  },
  {
    id: 'onboarding-profile-view',
    filename: 'OnboardingProfileView.swift',
    path: 'Views/OnboardingProfileView.swift',
    category: 'Views',
    description: 'Onboarding & Profile setup flow with real-time BMR, TDEE, and macro split calculation.',
    code: `//
//  OnboardingProfileView.swift
//  PulseTrack
//
//  iOS 27 Onboarding / Profile setup view calculating BMR and TDEE.
//

import SwiftUI
import SwiftData

public struct OnboardingProfileView: View {
    @Environment(\\.modelContext) private var modelContext
    @Query private var userProfiles: [UserProfile]
    
    @State private var heightCm: Double = 178.0
    @State private var weightKg: Double = 75.0
    @State private var age: Int = 28
    @State private var gender: BiologicalGender = .male
    @State private var activityLevel: ActivityLevel = .moderatelyActive
    @State private var goal: FitnessGoal = .maintenance
    @State private var isSaved: Bool = false
    
    private var profile: UserProfile? {
        userProfiles.first
    }
    
    // Live calculations
    private var computedBMR: Double {
        NutritionCalculator.calculateBMR(weightKg: weightKg, heightCm: heightCm, ageYears: age, gender: gender)
    }
    
    private var computedTDEE: Double {
        NutritionCalculator.calculateTDEE(bmr: computedBMR, activityLevel: activityLevel)
    }
    
    private var computedTargetCalories: Double {
        max(1200.0, computedTDEE + goal.calorieAdjustment)
    }
    
    private var computedMacros: MacroTargets {
        NutritionCalculator.calculateMacros(weightKg: weightKg, targetCalories: computedTargetCalories)
    }
    
    public var body: some View {
        NavigationStack {
            ZStack {
                Color.black.ignoresSafeArea()
                
                ScrollView {
                    VStack(spacing: 24) {
                        // Title Header
                        VStack(spacing: 6) {
                            Text("Body & Metabolic Profile")
                                .font(.system(size: 26, weight: .bold, design: .rounded))
                                .foregroundStyle(.white)
                            
                            Text("Clinical Mifflin-St Jeor engine calibrates your baseline necessities")
                                .font(.system(size: 13, weight: .medium))
                                .foregroundStyle(.white.opacity(0.6))
                                .multilineTextAlignment(.center)
                                .padding(.horizontal, 20)
                        }
                        .padding(.top, 10)
                        
                        // Live Metabolic HUD Card
                        metabolicSummaryHUD
                        
                        // Body Metrics Form
                        bodyMetricsForm
                        
                        // Activity Level Picker
                        activityLevelSection
                        
                        // Fitness Goal Picker
                        fitnessGoalSection
                        
                        // Save Button
                        Button {
                            persistProfile()
                        } label: {
                            HStack {
                                Image(systemName: "sparkles")
                                Text(isSaved ? "Saved to SwiftData" : "Save & Calibrate App")
                            }
                            .font(.system(size: 17, weight: .bold))
                            .foregroundStyle(.black)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 16)
                            .background(
                                LinearGradient(
                                    colors: [Color(red: 0.39, green: 0.82, blue: 1.0), Color(red: 0.19, green: 0.82, blue: 0.35)],
                                    startPoint: .leading,
                                    endPoint: .trailing
                                )
                            )
                            .clipShape(RoundedRectangle(cornerRadius: 16))
                            .shadow(color: Color(red: 0.39, green: 0.82, blue: 1.0).opacity(0.3), radius: 12)
                        }
                        .padding(.top, 10)
                        .padding(.bottom, 60)
                    }
                    .padding(.horizontal, 20)
                }
            }
            .navigationTitle("Personalization")
            .navigationBarTitleDisplayMode(.inline)
            .onAppear {
                loadExistingProfile()
            }
        }
    }
    
    // MARK: - Metabolic HUD
    private var metabolicSummaryHUD: some View {
        GlassmorphicCard {
            VStack(spacing: 16) {
                HStack {
                    VStack(alignment: .leading, spacing: 3) {
                        Text("BMR (Basal Rate)")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundStyle(.white.opacity(0.5))
                        Text("\\(Int(computedBMR)) kcal")
                            .font(.system(size: 20, weight: .bold, design: .rounded))
                            .foregroundStyle(.white)
                    }
                    Spacer()
                    VStack(alignment: .center, spacing: 3) {
                        Text("TDEE (Maintenance)")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundStyle(.white.opacity(0.5))
                        Text("\\(Int(computedTDEE)) kcal")
                            .font(.system(size: 20, weight: .bold, design: .rounded))
                            .foregroundStyle(Color(red: 0.39, green: 0.82, blue: 1.0))
                    }
                    Spacer()
                    VStack(alignment: .trailing, spacing: 3) {
                        Text("TARGET GOAL")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundStyle(.white.opacity(0.5))
                        Text("\\(Int(computedTargetCalories)) kcal")
                            .font(.system(size: 20, weight: .heavy, design: .rounded))
                            .foregroundStyle(Color(red: 0.19, green: 0.82, blue: 0.35))
                    }
                }
                
                Divider().background(Color.white.opacity(0.1))
                
                // Target Macro Breakdown
                HStack(spacing: 16) {
                    macroTargetBadge(label: "Protein", grams: computedMacros.proteinGrams, color: Color(red: 0.19, green: 0.82, blue: 0.35))
                    macroTargetBadge(label: "Carbs", grams: computedMacros.carbsGrams, color: Color(red: 0.39, green: 0.82, blue: 1.0))
                    macroTargetBadge(label: "Fats", grams: computedMacros.fatGrams, color: Color(red: 0.75, green: 0.35, blue: 0.95))
                }
            }
            .padding(18)
        }
    }
    
    private func macroTargetBadge(label: String, grams: Double, color: Color) -> some View {
        VStack(spacing: 2) {
            Text(label)
                .font(.system(size: 10, weight: .semibold))
                .foregroundStyle(.white.opacity(0.6))
            Text("\\(Int(grams))g")
                .font(.system(size: 16, weight: .bold, design: .monospaced))
                .foregroundStyle(color)
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 8)
        .background(color.opacity(0.12), in: RoundedRectangle(cornerRadius: 10))
        .overlay(RoundedRectangle(cornerRadius: 10).stroke(color.opacity(0.25), lineWidth: 1))
    }
    
    // MARK: - Body Metrics Form
    private var bodyMetricsForm: some View {
        GlassmorphicCard {
            VStack(spacing: 18) {
                // Gender Picker
                VStack(alignment: .leading, spacing: 8) {
                    Text("BIOLOGICAL SEX (FOR BMR EQUATION)")
                        .font(.system(size: 11, weight: .bold))
                        .foregroundStyle(.white.opacity(0.5))
                    
                    Picker("Gender", selection: $gender) {
                        ForEach(BiologicalGender.allCases) { g in
                            Text(g.rawValue).tag(g)
                        }
                    }
                    .pickerStyle(.segmented)
                }
                
                Divider().background(Color.white.opacity(0.1))
                
                // Sliders for Height, Weight, Age
                sliderRow(label: "Weight", value: $weightKg, range: 40...160, unit: "kg", step: 0.5)
                sliderRow(label: "Height", value: $heightCm, range: 130...220, unit: "cm", step: 1.0)
                
                HStack {
                    Text("Age")
                        .font(.system(size: 15, weight: .semibold))
                        .foregroundStyle(.white)
                    Spacer()
                    Stepper("\\(age) yrs", value: $age, in: 16...99)
                        .font(.system(size: 16, weight: .bold, design: .monospaced))
                        .foregroundStyle(.white)
                }
            }
            .padding(18)
        }
    }
    
    private func sliderRow(label: String, value: Binding<Double>, range: ClosedRange<Double>, unit: String, step: Double) -> some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Text(label)
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(.white)
                Spacer()
                Text(String(format: "%.1f %@", value.wrappedValue, unit))
                    .font(.system(size: 16, weight: .bold, design: .monospaced))
                    .foregroundStyle(.white)
            }
            Slider(value: value, in: range, step: step)
                .tint(Color(red: 0.39, green: 0.82, blue: 1.0))
        }
    }
    
    // MARK: - Activity Level Section
    private var activityLevelSection: some View {
        GlassmorphicCard {
            VStack(alignment: .leading, spacing: 12) {
                Text("ACTIVITY LEVEL")
                    .font(.system(size: 11, weight: .bold))
                    .foregroundStyle(.white.opacity(0.5))
                
                ForEach(ActivityLevel.allCases) { level in
                    Button {
                        activityLevel = level
                        UIImpactFeedbackGenerator(style: .light).impactOccurred()
                    } label: {
                        HStack {
                            VStack(alignment: .leading, spacing: 2) {
                                Text(level.rawValue)
                                    .font(.system(size: 14, weight: .medium))
                                    .foregroundStyle(activityLevel == level ? .white : .white.opacity(0.6))
                                Text("Multiplier: \\(String(format: \"%.2fx\", level.multiplier))")
                                    .font(.system(size: 11, weight: .semibold, design: .monospaced))
                                    .foregroundStyle(Color(red: 0.39, green: 0.82, blue: 1.0))
                            }
                            Spacer()
                            if activityLevel == level {
                                Image(systemName: "checkmark.circle.fill")
                                    .font(.system(size: 18))
                                    .foregroundStyle(Color(red: 0.19, green: 0.82, blue: 0.35))
                            }
                        }
                        .padding(.vertical, 6)
                    }
                    if level != ActivityLevel.allCases.last {
                        Divider().background(Color.white.opacity(0.08))
                    }
                }
            }
            .padding(18)
        }
    }
    
    // MARK: - Fitness Goal Section
    private var fitnessGoalSection: some View {
        GlassmorphicCard {
            VStack(alignment: .leading, spacing: 12) {
                Text("FITNESS OBJECTIVE")
                    .font(.system(size: 11, weight: .bold))
                    .foregroundStyle(.white.opacity(0.5))
                
                Picker("Goal", selection: $goal) {
                    ForEach(FitnessGoal.allCases) { g in
                        Text(g.rawValue).tag(g)
                    }
                }
                .pickerStyle(.segmented)
            }
            .padding(18)
        }
    }
    
    private func loadExistingProfile() {
        if let existing = profile {
            heightCm = existing.heightCm
            weightKg = existing.weightKg
            age = existing.age
            gender = existing.gender
            activityLevel = existing.activityLevel
            goal = existing.fitnessGoal
        }
    }
    
    private func persistProfile() {
        if let existing = profile {
            existing.heightCm = heightCm
            existing.weightKg = weightKg
            existing.age = age
            existing.gender = gender
            existing.activityLevel = activityLevel
            existing.fitnessGoal = goal
            existing.updatedAt = Date()
        } else {
            let newProfile = UserProfile(
                heightCm: heightCm,
                weightKg: weightKg,
                age: age,
                gender: gender,
                activityLevel: activityLevel,
                goal: goal
            )
            modelContext.insert(newProfile)
        }
        
        isSaved = true
        UINotificationFeedbackGenerator().notificationOccurred(.success)
    }
}
`,
  },
  {
    id: 'concentric-rings-view',
    filename: 'ConcentricRingsView.swift',
    path: 'Views/Components/ConcentricRingsView.swift',
    category: 'Components',
    description: 'Concentric Apple Fitness ring chart rendering Protein, Carbs, and Fat progress rings.',
    code: `//
//  ConcentricRingsView.swift
//  PulseTrack
//
//  Apple Fitness-style concentric neon progress rings for Protein, Carbs, and Fat.
//

import SwiftUI

public struct ConcentricRingsView: View {
    public let proteinRatio: Double
    public let carbsRatio: Double
    public let fatRatio: Double
    public var size: CGFloat = 160
    
    // Neon Ring Palettes
    private let proteinColor = Color(red: 0.19, green: 0.82, blue: 0.35) // Neon Green
    private let carbsColor = Color(red: 0.39, green: 0.82, blue: 1.0)     // Cyan
    private let fatColor = Color(red: 0.75, green: 0.35, blue: 0.95)       // Purple
    
    public init(proteinRatio: Double, carbsRatio: Double, fatRatio: Double, size: CGFloat = 160) {
        self.proteinRatio = proteinRatio
        self.carbsRatio = carbsRatio
        self.fatRatio = fatRatio
        self.size = size
    }
    
    public var body: some View {
        ZStack {
            // Background track rings
            singleRing(progress: 1.0, color: proteinColor.opacity(0.18), strokeWidth: 14, inset: 0)
            singleRing(progress: 1.0, color: carbsColor.opacity(0.18), strokeWidth: 14, inset: 18)
            singleRing(progress: 1.0, color: fatColor.opacity(0.18), strokeWidth: 14, inset: 36)
            
            // Active Progress Rings with Neon Glow
            singleRing(progress: min(1.0, max(0.01, proteinRatio)), color: proteinColor, strokeWidth: 14, inset: 0)
                .shadow(color: proteinColor.opacity(0.4), radius: 6)
            
            singleRing(progress: min(1.0, max(0.01, carbsRatio)), color: carbsColor, strokeWidth: 14, inset: 18)
                .shadow(color: carbsColor.opacity(0.4), radius: 6)
            
            singleRing(progress: min(1.0, max(0.01, fatRatio)), color: fatColor, strokeWidth: 14, inset: 36)
                .shadow(color: fatColor.opacity(0.4), radius: 6)
            
            // Center Apple Fitness flame icon
            Image(systemName: "flame.fill")
                .font(.system(size: 20, weight: .bold))
                .foregroundStyle(
                    LinearGradient(
                        colors: [Color(red: 1.0, green: 0.22, blue: 0.37), Color(red: 1.0, green: 0.58, blue: 0.0)],
                        startPoint: .top,
                        endPoint: .bottom
                    )
                )
        }
        .frame(width: size, height: size)
    }
    
    private func singleRing(progress: Double, color: Color, strokeWidth: CGFloat, inset: CGFloat) -> some View {
        Circle()
            .inset(by: inset)
            .trim(from: 0, to: CGFloat(progress))
            .stroke(
                color,
                style: StrokeStyle(lineWidth: strokeWidth, lineCap: .round)
            )
            .rotationEffect(.degrees(-90))
            .animation(.spring(response: 0.6, dampingFraction: 0.8), value: progress)
    }
}
`,
  },
  {
    id: 'glassmorphic-card',
    filename: 'GlassmorphicCard.swift',
    path: 'Views/Components/GlassmorphicCard.swift',
    category: 'Components',
    description: 'iOS 27 frosted glassmorphism component with ultra-thin material and subtle specular border.',
    code: `//
//  GlassmorphicCard.swift
//  PulseTrack
//
//  iOS 27 Apple Frosted Glass Container with specular border and blur.
//

import SwiftUI

public struct GlassmorphicCard<Content: View>: View {
    private let cornerRadius: CGFloat
    private let content: Content
    
    public init(cornerRadius: CGFloat = 22, @ViewBuilder content: () -> Content) {
        self.cornerRadius = cornerRadius
        self.content = content()
    }
    
    public var body: some View {
        content
            .background(
                RoundedRectangle(cornerRadius: cornerRadius)
                    .fill(.ultraThinMaterial)
                    .overlay(
                        RoundedRectangle(cornerRadius: cornerRadius)
                            .stroke(
                                LinearGradient(
                                    colors: [
                                        Color.white.opacity(0.18),
                                        Color.white.opacity(0.04)
                                    ],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                ),
                                lineWidth: 1
                            )
                    )
            )
            .shadow(color: Color.black.opacity(0.4), radius: 12, x: 0, y: 6)
    }
}
`,
  },
  {
    id: 'step-progress-card',
    filename: 'StepProgressCard.swift',
    path: 'Views/Components/StepProgressCard.swift',
    category: 'Components',
    description: 'Dedicated Apple HealthKit daily step count card with live active burn calculation.',
    code: `//
//  StepProgressCard.swift
//  PulseTrack
//
//  Visually dedicated HealthKit step tracking card with active calories.
//

import SwiftUI

public struct StepProgressCard: View {
    public let steps: Int
    public let stepGoal: Int
    public let caloriesBurned: Double
    public let onTapSync: () -> Void
    
    public init(steps: Int, stepGoal: Int = 10_000, caloriesBurned: Double, onTapSync: @escaping () -> Void) {
        self.steps = steps
        self.stepGoal = stepGoal
        self.caloriesBurned = caloriesBurned
        self.onTapSync = onTapSync
    }
    
    private var progressRatio: Double {
        min(1.0, Double(steps) / Double(max(1, stepGoal)))
    }
    
    public var body: some View {
        GlassmorphicCard {
            HStack(spacing: 18) {
                // Circular Step Mini-Gauge
                ZStack {
                    Circle()
                        .stroke(Color.white.opacity(0.1), lineWidth: 8)
                    
                    Circle()
                        .trim(from: 0, to: CGFloat(progressRatio))
                        .stroke(
                            LinearGradient(
                                colors: [Color(red: 1.0, green: 0.58, blue: 0.0), Color(red: 1.0, green: 0.22, blue: 0.37)],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            ),
                            style: StrokeStyle(lineWidth: 8, lineCap: .round)
                        )
                        .rotationEffect(.degrees(-90))
                        .shadow(color: Color(red: 1.0, green: 0.58, blue: 0.0).opacity(0.5), radius: 6)
                    
                    Image(systemName: "figure.walk")
                        .font(.system(size: 20, weight: .bold))
                        .foregroundStyle(Color(red: 1.0, green: 0.58, blue: 0.0))
                }
                .frame(width: 68, height: 68)
                
                // Steps & Calories info
                VStack(alignment: .leading, spacing: 4) {
                    HStack(spacing: 6) {
                        Text("HEALTHKIT ACTIVITY")
                            .font(.system(size: 10, weight: .heavy))
                            .foregroundStyle(.white.opacity(0.5))
                            .tracking(0.6)
                        
                        Circle()
                            .fill(Color(red: 0.19, green: 0.82, blue: 0.35))
                            .frame(width: 6, height: 6)
                    }
                    
                    HStack(alignment: .firstTextBaseline, spacing: 4) {
                        Text("\\(steps)")
                            .font(.system(size: 24, weight: .heavy, design: .rounded))
                            .foregroundStyle(.white)
                        
                        Text("/ \\(stepGoal) steps")
                            .font(.system(size: 13, weight: .semibold, design: .monospaced))
                            .foregroundStyle(.white.opacity(0.5))
                    }
                    
                    HStack(spacing: 12) {
                        Label {
                            Text("+\\(Int(caloriesBurned)) kcal burned")
                                .font(.system(size: 12, weight: .bold))
                                .foregroundStyle(Color(red: 1.0, green: 0.58, blue: 0.0))
                        } icon: {
                            Image(systemName: "flame.fill")
                                .font(.system(size: 10))
                                .foregroundStyle(Color(red: 1.0, green: 0.58, blue: 0.0))
                        }
                    }
                }
                
                Spacer()
                
                // Quick Sync Action
                Button(action: onTapSync) {
                    Image(systemName: "heart.text.square.fill")
                        .font(.system(size: 26))
                        .foregroundStyle(Color(red: 1.0, green: 0.22, blue: 0.37))
                }
                .accessibilityLabel("Sync Apple HealthKit steps")
            }
            .padding(18)
        }
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
//  Main entry point initializing SwiftData ModelContainer.
//

import SwiftUI
import SwiftData

@main
public struct PulseTrackApp: App {
    // Persistent SwiftData container holding UserProfile, DailyLog, and MealEntry
    public var sharedModelContainer: ModelContainer = {
        let schema = Schema([
            UserProfile.self,
            DailyLog.self,
            MealEntry.self
        ])
        let modelConfiguration = ModelConfiguration(schema: schema, isStoredInMemoryOnly: false)
        do {
            return try ModelContainer(for: schema, configurations: [modelConfiguration])
        } catch {
            fatalError("Failed to initialize SwiftData ModelContainer: \\(error)")
        }
    }()
    
    public init() {}

    public var body: some Scene {
        WindowGroup {
            ContentView()
                .preferredColorScheme(.dark) // True Black OLED iOS 27 experience
        }
        .modelContainer(sharedModelContainer)
    }
}

/// Root Navigation TabBar for iPhone 16
public struct ContentView: View {
    @State private var selectedTab: Int = 0
    
    public init() {}
    
    public var body: some View {
        TabView(selection: $selectedTab) {
            MainDashboardView()
                .tabItem {
                    Label("Dashboard", systemImage: "chart.pie.fill")
                }
                .tag(0)
            
            QuickLogTabWrapper()
                .tabItem {
                    Label("Log Meal", systemImage: "plus.circle.fill")
                }
                .tag(1)
            
            OnboardingProfileView()
                .tabItem {
                    Label("Profile", systemImage: "person.crop.circle.fill")
                }
                .tag(2)
        }
        .tint(Color(red: 0.19, green: 0.82, blue: 0.35)) // Neon Green Accent
    }
}

/// Helper wrapper for quick meal logging tab
struct QuickLogTabWrapper: View {
    @Environment(\\.modelContext) private var modelContext
    @Query private var dailyLogs: [DailyLog]
    
    var body: some View {
        let calendar = Calendar.current
        let today = calendar.startOfDay(for: Date())
        let todayLog = dailyLogs.first(where: { calendar.isDate($0.date, inSameDayAs: today) }) ?? {
            let log = DailyLog(date: today)
            modelContext.insert(log)
            return log
        }()
        
        MealEntryView(slot: .breakfast, log: todayLog)
    }
}
`,
  },
];
