import { StakeService } from '@penumbra-zone/protobuf';
import { getValidatorInfo } from '@penumbra-zone/getters/validator-info-response';
import { ValidatorInfoResponse, ValidatorInfo } from '@buf/penumbra-zone_penumbra.bufbuild_es/penumbra/core/component/stake/v1/stake_pb';
import { useQuery } from '@tanstack/react-query';
import { client } from './penumbra';

export const useValidators = (wallet?: string): (() => ValidatorInfo[]) => {
  const getStakeService = () => client.service(StakeService);
  const q = useQuery({
    queryKey: ['Validators'],
    queryFn: ({ signal }): Promise<ValidatorInfoResponse[]> =>
        Array.fromAsync(getStakeService().validatorInfo({})),
    select: (data: ValidatorInfoResponse[]) => data.map(getValidatorInfo)
  })

  const getValidators = () => q.isSuccess ? q.data : [];
  return getValidators;
}