"use client"

import * as React from "react"
import { Camera } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { useI18n } from "@/lib/hooks/use-i18n"
import { useUser } from "@/lib/firebase/hooks"
import {
  getUserDocument,
  updateUserProfile,
  updateUserInfo,
  ensureUserDocument,
  type UserDocument,
} from "@/lib/firestore-user"
import { ImageIcon } from "lucide-react"

export default function ProfilePage() {
  const { t } = useI18n()
  const { user, loading: authLoading } = useUser()
  
  const [userDoc, setUserDoc] = React.useState<UserDocument | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [saved, setSaved] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Form state
  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [bio, setBio] = React.useState("")
  const [avatarUrl, setAvatarUrl] = React.useState("")
  const [backgroundUrl, setBackgroundUrl] = React.useState("")

  // Load user document from Firestore
  React.useEffect(() => {
    if (!user) {
      setLoading(authLoading)
      return
    }

    let mounted = true

    async function loadUserData() {
      try {
        setLoading(true)
        setError(null)
        
        // Ensure the document exists
        const doc = await ensureUserDocument(user!.uid, user!.email || "", user!.displayName || undefined)
        
        if (!mounted) return
        
        setUserDoc(doc)
        setName(doc.name || "")
        setEmail(doc.email)
        setBio(doc.profile.bio || "")
        setAvatarUrl(doc.profile.avatarUrl || "")
        setBackgroundUrl(doc.profile.backgroundUrl || "")
      } catch (err) {
        console.error("[Profile] Error loading user data:", err)
        if (mounted) {
          setError(t("errorLoadingProfile"))
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    loadUserData()

    return () => {
      mounted = false
    }
  }, [user, authLoading, t])

  const handleSave = async () => {
    if (!user || !userDoc) return

    setSaving(true)
    setSaved(false)
    setError(null)

    try {
      // Update name/email if changed
      const infoUpdates: { name?: string | null; email?: string } = {}
      if (name !== userDoc.name) infoUpdates.name = name || null
      if (email !== userDoc.email) infoUpdates.email = email

      if (Object.keys(infoUpdates).length > 0) {
        await updateUserInfo(user.uid, infoUpdates)
      }

      // Update profile fields if changed
      const profileUpdates: Record<string, string | undefined> = {}
      if (bio !== (userDoc.profile.bio || "")) profileUpdates.bio = bio || undefined
      if (avatarUrl !== (userDoc.profile.avatarUrl || "")) profileUpdates.avatarUrl = avatarUrl || undefined
      if (backgroundUrl !== (userDoc.profile.backgroundUrl || "")) profileUpdates.backgroundUrl = backgroundUrl || undefined

      if (Object.keys(profileUpdates).length > 0) {
        await updateUserProfile(user.uid, profileUpdates)
      }

      // Reload the document
      const updatedDoc = await getUserDocument(user.uid)
      if (updatedDoc) {
        setUserDoc(updatedDoc)
      }

      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      console.error("[Profile] Error saving:", err)
      setError(t("errorSavingProfile"))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 lg:p-8 max-w-2xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">{t("profile")}</h1>
          <p className="text-muted-foreground">{t("managePersonalInfo")}</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">{t("loading")}</p>
        </div>
      </div>
    )
  }

  if (error && !userDoc) {
    return (
      <div className="p-6 lg:p-8 max-w-2xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">{t("profile")}</h1>
          <p className="text-muted-foreground">{t("managePersonalInfo")}</p>
        </div>
        <Card>
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">{t("profile")}</h1>
        <p className="text-muted-foreground">{t("managePersonalInfo")}</p>
      </div>

      <div className="space-y-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle>{t("personalInformation")}</CardTitle>
            <CardDescription>{t("updateProfileDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar */}
            <div className="flex items-start gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={avatarUrl || undefined} alt={name || "User"} />
                <AvatarFallback className="text-xl">
                  {name ? name.charAt(0).toUpperCase() : email.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="gap-2 bg-transparent" asChild>
                    <label htmlFor="avatar-url-input" className="cursor-pointer">
                      <Camera className="h-4 w-4" />
                      {t("changePhoto")}
                    </label>
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">{t("photoHint")}</p>
              </div>
            </div>

            {/* Avatar URL */}
            <div className="space-y-2">
              <Label htmlFor="avatar-url-input">{t("avatarUrl")}</Label>
              <Input
                id="avatar-url-input"
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder={t("avatarUrlPlaceholder")}
              />
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name">{t("name")}</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("namePlaceholder")}
              />
            </div>

            {/* Email (read-only) */}
            <div className="space-y-2">
              <Label htmlFor="email">{t("email")}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                disabled
                className="bg-muted cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground">
                Email is managed by your authentication provider
              </p>
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <Label htmlFor="bio">{t("bio")}</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder={t("bioPlaceholder")}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Profile Background */}
        {/* <Card>
          <CardHeader>
            <CardTitle>{t("profileBackground")}</CardTitle>
            <CardDescription>{t("profileBackgroundDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="background-url">{t("backgroundImageUrl")}</Label>
              <div className="flex gap-2">
                <Input
                  id="background-url"
                  type="url"
                  value={backgroundUrl}
                  onChange={(e) => setBackgroundUrl(e.target.value)}
                  placeholder={t("backgroundUrlPlaceholder")}
                  className="flex-1"
                />
              </div>
            </div>
*/}
            {/* Background Preview */}
             {/* {backgroundUrl && (
              <div className="space-y-2">
                <Label>Preview</Label>
                <div
                  className="h-32 rounded-lg border bg-cover bg-center"
                  style={{ backgroundImage: `url(${backgroundUrl})` }}
                />
              </div>
            )}
          </CardContent>
        </Card> */}

        {/* Save Button */}
        <div className="flex items-center gap-4">
          <Button onClick={handleSave} disabled={saving || !user}>
            {saving ? t("saving") : saved ? t("saved") : t("saveChanges")}
          </Button>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      </div>
    </div>
  )
}
