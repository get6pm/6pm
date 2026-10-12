import ExpoModulesCore

/// The app's way into the App Group: the capture inbox, the files widgets draw, the Live Activity.
public class SurfacesModule: Module {
  public func definition() -> ModuleDefinition {
    Name("Surfaces")

    AsyncFunction("writeSurface") { (name: String, json: String) in
      try SurfaceFiles.write(name: name, json: json)
    }

    AsyncFunction("writeSurfaceImage") { (name: String, pngBase64: String) in
      try SurfaceFiles.writeImage(name: name, pngBase64: pngBase64)
    }

    AsyncFunction("readInbox") { () -> [[String: String]] in
      try Inbox.read()
    }

    AsyncFunction("removeInbox") { (ids: [String]) in
      try Inbox.remove(ids)
    }

    Function("activitiesEnabled") { () -> Bool in
      LiveActivities.enabled
    }

    AsyncFunction("listActivities") { () -> [[String: String]] in
      LiveActivities.list()
    }

    AsyncFunction("startActivity") { (kind: String, key: String, stateJson: String) -> String? in
      LiveActivities.start(kind: kind, key: key, stateJson: stateJson)
    }

    AsyncFunction("updateActivity") { (id: String, stateJson: String) in
      await LiveActivities.update(id: id, stateJson: stateJson)
    }

    AsyncFunction("endActivity") { (id: String, finalStateJson: String?) in
      await LiveActivities.end(id: id, finalStateJson: finalStateJson)
    }
  }
}
