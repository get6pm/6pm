Pod::Spec.new do |s|
  s.name           = 'CompanionModel'
  s.version        = '1.0.0'
  s.summary        = 'The on-device model (Apple Foundation Models): reads questions and words lines.'
  s.description    = s.summary
  s.author         = 'Odd Eggs'
  s.homepage       = 'https://6pm.oddeggs.studio'
  s.license        = 'UNLICENSED'
  s.platforms      = { :ios => '17.0' }
  s.source         = { git: '' }
  s.static_framework = true
  s.swift_version  = '5.9'

  s.dependency 'ExpoModulesCore'
  # Present from iOS 26; the app still runs on 17, where the module says it is unavailable.
  s.weak_frameworks = 'FoundationModels'

  s.pod_target_xcconfig = { 'DEFINES_MODULE' => 'YES' }
  s.source_files = '**/*.swift'
end
