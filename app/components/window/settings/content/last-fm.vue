<script lang="ts" setup>
const { completeAuth, removeAuth, startAuth } = useLastFm()
const lastFm = useLastFm()

const token = shallowRef<string | null>(null)
const isAuthDialogOpen = shallowRef(false)
const isCompletingAuth = shallowRef(false)

async function handleStartAuth() {
  if (isAuthDialogOpen.value || lastFm.lastFmProfile) return

  isAuthDialogOpen.value = true

  try {
    token.value = await startAuth()
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    emitError({ data: errorMsg, type: 'LastFm' })
    isAuthDialogOpen.value = false
  }
}

async function handleCompleteAuth() {
  if (!token.value) return

  isCompletingAuth.value = true

  try {
    await completeAuth(token.value)
  } catch {
    emitError({
      data: 'Failed to complete authentication. Did you complete the process in the new tab before continuing?',
      type: 'LastFm',
    })
  } finally {
    isAuthDialogOpen.value = false
    token.value = null
    isCompletingAuth.value = false
  }
}

const { isOnline } = useNetwork()
</script>

<template>
  <WindowSettingsContentTabLayout
    title="Last.fm"
    class="flex *:h-full"
  >
    <div class="flex flex-col gap-2 w-full items-center">
      <div class="flex gap-2 w-full items-center">
        <ULabel for="doScrobbling"> Enable scrobbling </ULabel>
        <USwitch
          id="doScrobbling"
          v-model="$settings.lastFm.doScrobbling"
          :disabled="!lastFm.lastFmProfile"
        />
      </div>
      <div class="flex gap-2 w-full items-center">
        <ULabel for="doOfflineScrobbling"> Update "now playing" status </ULabel>
        <USwitch
          id="doNowPlayingUpdates"
          v-model="$settings.lastFm.doNowPlayingUpdates"
          :disabled="!lastFm.lastFmProfile"
        />
      </div>
      <div class="flex gap-2 w-full items-center">
        <ULabel for="doOfflineScrobbling"> Enable offline scrobbling </ULabel>
        <USwitch
          id="doOfflineScrobbling"
          v-model="$settings.lastFm.doOfflineScrobbling"
          :disabled="!lastFm.lastFmProfile"
        />
      </div>
    </div>
    <div class="flex shrink-0 gap-4 w-fit justify-between">
      <template v-if="!isOnline">
        <!-- <div class="flex items-center justify-around gap-2 text-muted-foreground"> -->
        <div class="text-muted-foreground flex flex-col items-end justify-around">
          <p class="italic">You are currently offline</p>
          <UButton
            class="w-fit"
            :disabled="true"
          >
            Connect
          </UButton>
          <!-- <UHoverCardRoot>
            <UHoverCardTrigger as-child>
              <Icon name="tabler:info-circle" class="size-3.5!" />
            </UHoverCardTrigger>
            <UHoverCardContent side="left">
              <p>
                If you previously connected your Last.fm account, scrobbles are being cached and will be sent when you are back online.
              </p>
            </UHoverCardContent>
          </UHoverCardRoot> -->
        </div>
        <div
          class="border border-muted rounded-sm border-dashed grid size-[72px] place-items-center"
        >
          <Icon
            name="tabler:wifi-off"
            class="text-muted-foreground size-6!"
          />
        </div>
      </template>
      <template v-else-if="lastFm.lastFmProfilePending">
        <div class="flex flex-col items-end justify-around">
          <USkeleton class="h-lh w-32" />
          <UButton
            :disabled="true"
            class="w-fit"
            variant="outline"
          >
            Loading...
          </UButton>
        </div>
        <div class="border border-muted rounded-sm border-dashed size-[72px]"></div>
      </template>
      <template v-else-if="lastFm.lastFmProfile">
        <div class="flex flex-col items-end justify-around">
          <p>
            Signed in as <span class="font-bold">{{ lastFm.lastFmProfile.name }}</span>
          </p>
          <UButton
            class="w-fit"
            variant="danger"
            @click="removeAuth()"
          >
            Disconnect
          </UButton>
        </div>
        <img
          :src="getLastFmImage(lastFm.lastFmProfile.image, 3) ?? ''"
          alt=""
          width="72"
          height="72"
          class="rounded-sm"
        />
      </template>
      <template v-else>
        <div class="flex flex-col items-end justify-around">
          <p>No account connected</p>
          <UAlertDialogRoot :open="isAuthDialogOpen">
            <UAlertDialogTrigger as-child>
              <UButton
                class="w-fit"
                :is-loading="isAuthDialogOpen"
                @click="handleStartAuth()"
              >
                Connect
              </UButton>
            </UAlertDialogTrigger>
            <UAlertDialogContent>
              <p class="text-sm">
                You are about to be directed to a new tab in your browser. Click button below once
                you have completed the authentication process.
              </p>
              <UAlertDialogFooter>
                <UButton
                  :is-loading="isCompletingAuth"
                  @click="handleCompleteAuth()"
                >
                  Complete
                </UButton>
              </UAlertDialogFooter>
            </UAlertDialogContent>
          </UAlertDialogRoot>
        </div>
        <div class="border border-muted rounded-sm border-dashed size-[72px]" />
      </template>
    </div>
  </WindowSettingsContentTabLayout>
</template>
