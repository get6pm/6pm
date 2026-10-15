Pod::Spec.new do |s|
  s.name           = 'MicStream'
  s.version        = '1.0.0'
  s.summary        = 'The microphone as 16 kHz mono PCM chunks, for a realtime transcriber.'
  s.description    = s.summary
  s.author         = 'Odd Eggs'
  s.homepage       = 'https://6pm.oddeggs.studio'
  s.license        = 'UNLICENSED'
  s.platforms      = { :ios => '17.0' }
  s.source         = { git: '' }
  s.static_framework = true
  s.swift_version  = '5.9'

  s.dependency 'ExpoModulesCore'

  s.pod_target_xcconfig = { 'DEFINES_MODULE' => 'YES' }
  s.source_files = '**/*.swift'
end
