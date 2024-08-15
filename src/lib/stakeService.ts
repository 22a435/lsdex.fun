import { StakeService } from '@penumbra-zone/protobuf';
import { getValidatorInfo } from '@penumbra-zone/getters/validator-info-response';
import { ValidatorInfoResponse, ValidatorInfo } from '@buf/penumbra-zone_penumbra.bufbuild_es/penumbra/core/component/stake/v1/stake_pb';
import { useQuery } from '@tanstack/react-query';
import { client } from '@/src/lib/penumbra';

export const useValidators = (): ValidatorInfo[] => {
  const q = useQuery({
    queryKey: ['Validators'],
    queryFn: (): Promise<ValidatorInfoResponse[]> =>
        Array.fromAsync(client.service(StakeService).validatorInfo({})),
    select: (data: ValidatorInfoResponse[]) => data.map(getValidatorInfo)
  })
  return q.isSuccess ? q.data : [];
}