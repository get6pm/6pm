Pod::Spec.new do |s|
  s.name           = 'DropText'
  s.version        = '1.0.0'
  s.summary        = 'Lets text dragged from another app, a bank line beside 6pm, be dropped on 6pm.'
  s.description    = s.summary
  s.author         = 'Odd Eggs'
  s.homepage       = 'https://6pm.oddeggs.studio'
  s.license        = 'Apache-2.0'
  s.platforms      = { :ios => '17.0' }
  s.source         = { git: '' }
  s.static_framework = true
  s.swift_version  = '5.9'

  s.dependency 'ExpoModulesCore'

  s.pod_target_xcconfig = { 'DEFINES_MODULE' => 'YES' }
  s.source_files = '**/*.swift'
end
