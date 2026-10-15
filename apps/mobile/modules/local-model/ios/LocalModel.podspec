require 'digest'
require 'fileutils'
require 'tmpdir'

# Google's LiteRT-LM runtime, as the prebuilt framework its Swift package ships. Fetched once at
# pod install from the pinned release and checked against its SHA-256, so nothing large is
# committed and a changed file never builds.
litert_lm_version = '0.17.1'
litert_lm_url = "https://github.com/google-ai-edge/LiteRT-LM/releases/download/v#{litert_lm_version}/CLiteRTLM.xcframework.zip"
litert_lm_sha256 = 'c94fc12aa0403cb47208e419cc3bfe258214ea17035f7a63c16de536869f2186'

fetch_litert_lm = lambda do |into|
  stamp = File.join(into, ".litert-lm-#{litert_lm_sha256}")
  next if File.exist?(stamp) && File.exist?(File.join(into, 'CLiteRTLM.xcframework', 'Info.plist'))

  FileUtils.rm_rf(into)
  FileUtils.mkdir_p(into)
  Dir.mktmpdir('litert-lm') do |tmp|
    zip = File.join(tmp, 'CLiteRTLM.xcframework.zip')
    system('curl', '-fsSL', '--retry', '3', '-o', zip, litert_lm_url, exception: true)
    actual = Digest::SHA256.file(zip).hexdigest
    raise "LiteRT-LM download is #{actual}, expected #{litert_lm_sha256}" unless actual == litert_lm_sha256

    system('unzip', '-q', '-o', zip, '-d', into, exception: true)
  end
  FileUtils.touch(stamp)
end

fetch_litert_lm.call(File.join(__dir__, 'Frameworks'))

Pod::Spec.new do |s|
  s.name           = 'LocalModel'
  s.version        = '1.0.0'
  s.summary        = 'The downloaded local model: fetches it, loads it and writes with it, on the phone.'
  s.description    = s.summary
  s.author         = 'Odd Eggs'
  s.homepage       = 'https://6pm.oddeggs.studio'
  s.license        = 'UNLICENSED'
  s.platforms      = { :ios => '17.0' }
  s.source         = { git: '' }
  s.static_framework = true
  s.swift_version  = '5.9'

  s.dependency 'ExpoModulesCore'
  # A dynamic framework with device and simulator slices; CocoaPods embeds it in the app.
  s.vendored_frameworks = 'Frameworks/CLiteRTLM.xcframework'
  s.frameworks = 'Metal', 'CryptoKit'

  s.pod_target_xcconfig = { 'DEFINES_MODULE' => 'YES' }
  s.source_files = '*.swift'
end
