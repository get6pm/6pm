Pod::Spec.new do |s|
  s.name           = 'ScanCamera'
  s.version        = '1.0.0'
  s.summary        = 'The Scan camera: QR codes and receipts in one live view, read on this iPhone.'
  s.description    = s.summary
  s.author         = 'Odd Eggs'
  s.homepage       = 'https://at6pm.app'
  s.license        = 'Apache-2.0'
  s.platforms      = { :ios => '17.0' }
  s.source         = { git: '' }
  s.static_framework = true
  s.swift_version  = '5.9'

  s.dependency 'ExpoModulesCore'
  s.frameworks = 'AVFoundation', 'Vision', 'CoreImage', 'PhotosUI'

  s.pod_target_xcconfig = { 'DEFINES_MODULE' => 'YES' }
  s.source_files = '**/*.swift'
end
