import Foundation
import Supabase

// MARK: - AnyJSON helpers

extension AnyJSON {
    /// Returns the string value if this JSON value is a `.string`, otherwise nil.
    var stringValue: String? {
        if case .string(let s) = self { return s }
        return nil
    }
}

// MARK: - Binding helpers

import SwiftUI

extension Binding where Value == Bool {
    /// Creates a Bool binding from an optional — true while the optional is non-nil.
    static func present<T>(_ optional: Binding<T?>) -> Binding<Bool> {
        Binding(
            get: { optional.wrappedValue != nil },
            set: { if !$0 { optional.wrappedValue = nil } }
        )
    }
}
